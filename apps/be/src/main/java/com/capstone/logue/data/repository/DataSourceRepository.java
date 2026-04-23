package com.capstone.logue.data.repository;

import com.capstone.logue.global.entity.DataSource;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * {@link DataSource} 엔티티 영속 계층 인터페이스.
 *
 * <p>본 이슈(#31) 범위에서는 단건 조회·삭제 및 다건 삭제만 사용합니다.
 * 목록 조회·정렬·페이지네이션은 후속 이슈에서 추가됩니다.</p>
 */
public interface DataSourceRepository extends JpaRepository<DataSource, Long> {

    /**
     * 지정한 id 집합에 해당하는 DataSource 들을 한 번에 조회합니다.
     * 다건 삭제 요청 시 소유자 검증을 위해 사용됩니다.
     *
     * @param ids 조회할 DataSource id 집합
     * @return 조회된 DataSource 목록 (존재하지 않는 id는 결과에서 제외됨)
     */
    List<DataSource> findAllByIdIn(Collection<Long> ids);
}
