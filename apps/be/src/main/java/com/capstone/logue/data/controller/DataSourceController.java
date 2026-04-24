package com.capstone.logue.data.controller;

import com.capstone.logue.auth.provider.SecurityContextProvider;
import com.capstone.logue.data.dto.GetDataSourceListResponse;
import com.capstone.logue.data.dto.GetFileResponse;
import com.capstone.logue.data.dto.SortType;
import com.capstone.logue.data.dto.UploadFileResponse;
import com.capstone.logue.data.service.DataSourceService;
import com.capstone.logue.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * DataSource CRUD REST 엔드포인트.
 *
 * <p>사용자 식별은 {@code Authorization: Bearer &lt;accessToken&gt;} 기반 JWT 인증으로 처리되며,
 * 인증된 사용자 ID 는 {@link SecurityContextProvider} 를 통해 조회됩니다.</p>
 */
@Tag(name = "DataSource", description = "CSV 데이터 소스 업로드/조회/삭제 API")
@RestController
@RequestMapping("/api/datasources")
@RequiredArgsConstructor
public class DataSourceController {

    private final DataSourceService dataSourceService;
    private final SecurityContextProvider securityContextProvider;

    /**
     * CSV 파일을 업로드하여 DataSource 를 생성합니다.
     *
     * @param file 업로드할 CSV 파일
     * @return 생성된 DataSource id 포함 응답
     */
    @Operation(
            summary = "CSV 파일 업로드",
            description = "multipart/form-data 로 CSV 파일을 업로드하고 DataSource 를 생성합니다."
    )
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UploadFileResponse> upload(
            @RequestPart("file") MultipartFile file
    ) {
        Long userId = securityContextProvider.getAuthenticatedUserId();
        UploadFileResponse response = dataSourceService.upload(userId, file);
        return ApiResponse.success("CSV 파일이 업로드되었습니다.", response);
    }

    /**
     * 현재 사용자가 소유한 DataSource 목록을 정렬·페이지네이션 조건으로 조회합니다.
     *
     * <p>{@code sort} 파라미터는 선택이며 미입력 시 {@link SortType#LATEST} (업로드 최신 순)로 처리됩니다.
     * {@code MOST_USED} 는 AnalysisFlow 참조 수가 많은 순이며, 동률인 경우 파일명 사전순으로 정렬됩니다.</p>
     *
     * @param sort 정렬 기준 ({@code LATEST} | {@code MOST_USED}, 생략 시 {@code LATEST})
     * @param page 0-base 페이지 번호
     * @param size 페이지당 항목 수
     * @return 정렬/페이지 메타와 DataSource 요약 목록을 포함한 응답
     */
    @Operation(
            summary = "데이터 소스 목록 조회",
            description = "정렬 기준(LATEST / MOST_USED)과 페이지네이션을 적용한 DataSource 목록을 반환합니다."
    )
    @GetMapping
    public ApiResponse<GetDataSourceListResponse> getList(
            @Parameter(description = "정렬 기준. 생략 시 LATEST 로 처리", example = "LATEST")
            @RequestParam(value = "sort", required = false) SortType sort,

            @Parameter(description = "0-base 페이지 번호", example = "0")
            @RequestParam("page") int page,

            @Parameter(description = "페이지당 항목 수", example = "20")
            @RequestParam("size") int size
    ) {
        Long userId = securityContextProvider.getAuthenticatedUserId();
        GetDataSourceListResponse response = dataSourceService.getList(userId, sort, page, size);
        return ApiResponse.success("데이터 소스 목록 조회 성공", response);
    }

    /**
     * 지정한 DataSource 단건을 조회합니다.
     *
     * @param dataSourceId 조회할 DataSource id
     * @return 파일 메타 및 미리보기 데이터를 포함한 응답
     */
    @Operation(summary = "데이터 소스 단건 조회", description = "DataSource 메타데이터와 CSV 미리보기(헤더+행)를 반환합니다.")
    @GetMapping("/{dataSourceId}")
    public ApiResponse<GetFileResponse> getOne(
            @Parameter(description = "조회할 DataSource id", example = "1")
            @PathVariable Long dataSourceId
    ) {
        Long userId = securityContextProvider.getAuthenticatedUserId();
        GetFileResponse response = dataSourceService.getOne(userId, dataSourceId);
        return ApiResponse.success("데이터 소스 조회에 성공했습니다.", response);
    }

    /**
     * 지정한 DataSource 한 건을 삭제합니다.
     */
    @Operation(summary = "데이터 소스 단건 삭제")
    @DeleteMapping("/{dataSourceId}")
    public ApiResponse<Void> deleteOne(
            @Parameter(description = "삭제할 DataSource id", example = "1")
            @PathVariable Long dataSourceId
    ) {
        Long userId = securityContextProvider.getAuthenticatedUserId();
        dataSourceService.deleteOne(userId, dataSourceId);
        return ApiResponse.success("데이터 소스를 삭제했습니다.");
    }

    /**
     * 여러 DataSource 를 한 번에 삭제합니다.
     *
     * <p>쿼리 파라미터 {@code id} 를 콤마로 구분하거나 여러 번 반복하여 전달할 수 있습니다.
     * 예: {@code ?id=1,2,3} 또는 {@code ?id=1&id=2&id=3}</p>
     */
    @Operation(summary = "데이터 소스 다건 삭제")
    @DeleteMapping
    public ApiResponse<Void> deleteMany(
            @Parameter(description = "삭제할 DataSource id 리스트", example = "1,2,3")
            @RequestParam("id") List<Long> ids
    ) {
        Long userId = securityContextProvider.getAuthenticatedUserId();
        dataSourceService.deleteMany(userId, ids);
        return ApiResponse.success("선택한 데이터 소스들을 삭제했습니다.");
    }
}
