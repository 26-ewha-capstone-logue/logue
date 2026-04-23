package com.capstone.logue.global.storage.s3;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 공용 S3 스토리지 설정 프로퍼티.
 *
 * <p>환경(application-*.properties 또는 SSM)에서 주입되며 S3 버킷을 사용하는 모든 도메인이 공유합니다.
 * 버킷 내부 경로 prefix 는 각 도메인 스토리지 구현체에서 결합하여 사용하세요.</p>
 *
 * @param region    AWS 리전 (예: ap-northeast-2)
 * @param bucket    공용 S3 버킷 이름
 * @param prefix    기본 오브젝트 경로 prefix (예: "datasources")
 * @param accessKey 로컬/개발 환경에서만 사용하는 access key. 운영은 IAM Role 사용.
 * @param secretKey 로컬/개발 환경에서만 사용하는 secret key. 운영은 IAM Role 사용.
 */
@ConfigurationProperties(prefix = "logue.storage.s3")
public record S3StorageProperties(
        String region,
        String bucket,
        String prefix,
        String accessKey,
        String secretKey
) {
    public S3StorageProperties {
        if (prefix == null || prefix.isBlank()) {
            prefix = "datasources";
        }
    }
}
