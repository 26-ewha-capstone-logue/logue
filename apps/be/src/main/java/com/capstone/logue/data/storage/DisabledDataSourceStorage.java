package com.capstone.logue.data.storage;

import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import java.io.InputStream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

/**
 * S3 설정이 없는 환경(로컬/테스트)에서 컨텍스트를 정상 부트업 하기 위한 기본 스토리지.
 *
 * <p>모든 쓰기/읽기 호출에서 {@link ErrorCode#DATASOURCE_STORAGE_ERROR} 예외를 발생시키며,
 * 실제 업로드/조회 기능은 사용할 수 없음을 로그로 경고합니다.
 * 운영 환경에서는 {@code logue.storage.s3.bucket} 이 주입되어 {@link S3DataSourceStorage} 가 우선됩니다.</p>
 */
@Slf4j
@Component
@ConditionalOnMissingBean(value = DataSourceStorage.class, ignored = DisabledDataSourceStorage.class)
public class DisabledDataSourceStorage implements DataSourceStorage {

    public DisabledDataSourceStorage() {
        log.warn("[DisabledDataSourceStorage] S3 설정(logue.storage.s3.bucket)이 없어 스토리지 기능이 비활성화되었습니다.");
    }

    @Override
    public String store(Long userId, String originalName, InputStream input, long size, String contentType) {
        throw new LogueException(ErrorCode.DATASOURCE_STORAGE_ERROR);
    }

    @Override
    public InputStream open(String storageKey) {
        throw new LogueException(ErrorCode.DATASOURCE_STORAGE_ERROR);
    }

    @Override
    public boolean delete(String storageKey) {
        log.warn("[DisabledDataSourceStorage] delete no-op key={}", storageKey);
        return false;
    }
}
