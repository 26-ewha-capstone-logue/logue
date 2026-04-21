package com.capstone.logue.data.storage;

import java.io.InputStream;

/**
 * DataSource CSV 파일 바이너리를 저장·조회·삭제하는 추상화 인터페이스.
 *
 * <p>본 이슈(#31)에서는 로컬 파일 시스템 구현체({@link LocalDataSourceStorage})만 제공되며,
 * 추후 오브젝트 스토리지(S3 등) 구현체로 교체 가능합니다.</p>
 */
public interface DataSourceStorage {

    /**
     * 업로드된 파일을 저장하고 스토리지 키를 반환합니다.
     *
     * @param userId       업로드한 사용자 id (스토리지 내 폴더 분리용)
     * @param originalName 원본 파일명 (확장자 포함)
     * @param input        파일 바이트 스트림
     * @param size         파일 바이트 크기 (S3 Content-Length 지정에 사용)
     * @param contentType  MIME 타입 (예: text/csv). null 이면 application/octet-stream 처리
     * @return 저장 위치를 식별할 수 있는 스토리지 키
     */
    String store(Long userId, String originalName, InputStream input, long size, String contentType);

    /**
     * 저장된 파일의 바이트 스트림을 열어 반환합니다.
     * 호출자는 사용 후 반드시 stream을 닫아야 합니다.
     *
     * @param storageKey {@link #store(Long, String, InputStream)} 에서 반환한 키
     * @return 파일 내용 입력 스트림
     */
    InputStream open(String storageKey);

    /**
     * 저장된 파일을 제거합니다. 이미 없으면 무시합니다.
     * 삭제에 실패해도 예외를 전파하지 않고 false 를 반환합니다.
     *
     * @param storageKey 삭제할 파일의 스토리지 키
     * @return 실제 파일을 삭제했으면 true, 파일이 없거나 실패하면 false
     */
    boolean delete(String storageKey);
}
