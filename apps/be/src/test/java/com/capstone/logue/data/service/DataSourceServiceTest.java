package com.capstone.logue.data.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.logue.data.dto.FilePreview;
import com.capstone.logue.data.dto.UploadFileResponse;
import com.capstone.logue.data.repository.DataSourceRepository;
import com.capstone.logue.data.repository.UserLookupRepository;
import com.capstone.logue.data.storage.DataSourceStorage;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

/**
 * {@link DataSourceService} 비즈니스 규칙 단위 테스트.
 *
 * <p>저장소/스토리지/파서 의존성은 모두 Mockito 로 대체하며, 권한 검증과 입력 검증 분기만을 검증합니다.</p>
 */
@ExtendWith(MockitoExtension.class)
class DataSourceServiceTest {

    private static final Long OWNER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;

    @Mock private DataSourceRepository dataSourceRepository;
    @Mock private UserLookupRepository userLookupRepository;
    @Mock private DataSourceStorage storage;
    @Mock private CsvParser csvParser;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private DataSourceService service;

    @BeforeEach
    void setUp() {
        service = new DataSourceService(
                dataSourceRepository,
                userLookupRepository,
                storage,
                csvParser,
                objectMapper
        );
    }

    @Test
    @DisplayName("CSV 확장자가 아닌 파일 업로드 시 DATASOURCE_INVALID_FILE 예외가 발생한다")
    void upload_nonCsvExtension_throwsInvalidFile() {
        MultipartFile notCsv = new MockMultipartFile(
                "file", "report.txt", "text/plain", "hello".getBytes()
        );

        assertThatThrownBy(() -> service.upload(OWNER_ID, notCsv))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.DATASOURCE_INVALID_FILE);

        verify(storage, never()).store(anyLong(), anyString(), any(), anyLong(), anyString());
        verify(dataSourceRepository, never()).save(any());
    }

    @Test
    @DisplayName("정상 CSV 업로드 시 사용자 조회·스토리지 저장·DB 저장이 모두 수행된다")
    void upload_validCsv_persistsDataSource() {
        MultipartFile csv = new MockMultipartFile(
                "file", "sales.csv", "text/csv", "a,b\n1,2\n".getBytes()
        );
        User owner = User.builder().id(OWNER_ID).email("owner@test.com")
                .providerUserId("p-1").name("owner").provider("GOOGLE").build();
        FilePreview preview = new FilePreview(List.of("a", "b"), List.of(List.of("1", "2")));
        DataSource savedEntity = DataSource.builder()
                .id(100L).user(owner).fileName("sales.csv").fileSize(8L)
                .storageKey("s3-key").schemaJson(objectMapper.createObjectNode())
                .rowCount(1).columnCount(2).build();

        when(userLookupRepository.findById(OWNER_ID)).thenReturn(Optional.of(owner));
        when(csvParser.parse(any(InputStream.class))).thenReturn(preview);
        when(storage.store(eq(OWNER_ID), eq("sales.csv"), any(InputStream.class), anyLong(), anyString()))
                .thenReturn("s3-key");
        when(dataSourceRepository.save(any(DataSource.class))).thenReturn(savedEntity);

        UploadFileResponse response = service.upload(OWNER_ID, csv);

        assertThat(response.dataSourceId()).isEqualTo(100L);
        verify(storage).store(eq(OWNER_ID), eq("sales.csv"), any(InputStream.class), anyLong(), anyString());
        verify(dataSourceRepository).save(any(DataSource.class));
    }

    @Test
    @DisplayName("남의 DataSource 단건 조회 시 DATASOURCE_FORBIDDEN 예외가 발생한다")
    void getOne_notOwner_throwsForbidden() {
        User other = User.builder().id(OTHER_USER_ID).email("other@test.com")
                .providerUserId("p-2").name("other").provider("GOOGLE").build();
        DataSource otherOwned = DataSource.builder()
                .id(10L).user(other).fileName("x.csv").fileSize(1L)
                .storageKey("k").schemaJson(objectMapper.createObjectNode())
                .rowCount(0).columnCount(0).build();
        when(dataSourceRepository.findById(10L)).thenReturn(Optional.of(otherOwned));

        assertThatThrownBy(() -> service.getOne(OWNER_ID, 10L))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.DATASOURCE_FORBIDDEN);
    }

    @Test
    @DisplayName("존재하지 않는 id 단건 삭제 시 DATASOURCE_NOT_FOUND 예외가 발생하고 스토리지·DB 삭제는 호출되지 않는다")
    void deleteOne_missingId_throwsNotFound() {
        when(dataSourceRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteOne(OWNER_ID, 999L))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.DATASOURCE_NOT_FOUND);

        verify(storage, never()).delete(anyString());
        verify(dataSourceRepository, never()).delete(any());
    }

    @Test
    @DisplayName("다건 삭제 요청에 남의 id 가 섞여 있으면 DATASOURCE_FORBIDDEN 으로 전체가 실패한다")
    void deleteMany_mixedOwners_throwsForbidden() {
        User owner = User.builder().id(OWNER_ID).email("o@test.com")
                .providerUserId("p-1").name("o").provider("GOOGLE").build();
        User other = User.builder().id(OTHER_USER_ID).email("x@test.com")
                .providerUserId("p-2").name("x").provider("GOOGLE").build();
        DataSource mine = DataSource.builder().id(1L).user(owner).fileName("a.csv").fileSize(1L)
                .storageKey("k1").schemaJson(objectMapper.createObjectNode())
                .rowCount(0).columnCount(0).build();
        DataSource theirs = DataSource.builder().id(2L).user(other).fileName("b.csv").fileSize(1L)
                .storageKey("k2").schemaJson(objectMapper.createObjectNode())
                .rowCount(0).columnCount(0).build();
        when(dataSourceRepository.findAllByIdIn(List.of(1L, 2L)))
                .thenReturn(List.of(mine, theirs));

        assertThatThrownBy(() -> service.deleteMany(OWNER_ID, List.of(1L, 2L)))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.DATASOURCE_FORBIDDEN);

        verify(storage, never()).delete(anyString());
        verify(dataSourceRepository, never()).deleteAll(any());
    }

    @Test
    @DisplayName("다건 삭제 요청에 존재하지 않는 id 가 있으면 DATASOURCE_NOT_FOUND 로 전체가 실패한다")
    void deleteMany_missingId_throwsNotFound() {
        User owner = User.builder().id(OWNER_ID).email("o@test.com")
                .providerUserId("p-1").name("o").provider("GOOGLE").build();
        DataSource mine = DataSource.builder().id(1L).user(owner).fileName("a.csv").fileSize(1L)
                .storageKey("k1").schemaJson(objectMapper.createObjectNode())
                .rowCount(0).columnCount(0).build();
        when(dataSourceRepository.findAllByIdIn(List.of(1L, 999L)))
                .thenReturn(List.of(mine));

        assertThatThrownBy(() -> service.deleteMany(OWNER_ID, List.of(1L, 999L)))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.DATASOURCE_NOT_FOUND);

        verify(dataSourceRepository, never()).deleteAll(any());
    }
}
