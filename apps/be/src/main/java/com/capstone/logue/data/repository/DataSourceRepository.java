package com.capstone.logue.data.repository;

import com.capstone.logue.global.entity.DataSource;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * {@link DataSource} 엔티티 영속 계층 인터페이스.
 *
 * <p>현재 이슈(#32) 까지 지원되는 연산:
 * 단건 조회·삭제, 다건 삭제, 소유자 기준 목록 조회(최근순/사용량순 + 페이지네이션).</p>
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

    /**
     * 특정 사용자가 소유한 DataSource 목록을 페이지 단위로 조회합니다.
     *
     * <p>정렬 기준은 {@link Pageable#getSort()} 에 의해 결정됩니다. 최근 업로드 순 정렬의 경우
     * 호출자가 {@code Sort.by("createdAt").descending()} 를 포함한 {@link Pageable} 을 전달해야 합니다.</p>
     *
     * @param userId   소유자 사용자 id
     * @param pageable 페이지/사이즈/정렬 정보
     * @return 사용자 소유 DataSource 페이지
     */
    Page<DataSource> findAllByUserId(Long userId, Pageable pageable);

    /**
     * 특정 사용자가 소유한 DataSource 목록을 사용량 많은 순으로 페이지 단위 조회합니다.
     *
     * <p>"사용량"은 해당 DataSource 를 참조하는 {@link com.capstone.logue.global.entity.AnalysisFlow}
     * 레코드 수로 정의합니다. 채팅창(분석 플로우)에 1회 올릴 때 사용량 1회로 집계됩니다.
     * 사용량이 동일한 경우 파일명 사전순으로 정렬됩니다.</p>
     *
     * <p>정렬이 쿼리에 내장돼 있으므로 호출자는 정렬 없는({@code Sort.unsorted()}) {@link Pageable}
     * 을 전달해야 합니다. Pageable 의 Sort 는 쿼리에 영향을 주지 않지만 혼동을 피하기 위함입니다.</p>
     *
     * @param userId   소유자 사용자 id
     * @param pageable 페이지/사이즈 정보 (Sort 미지정 권장)
     * @return 사용량 내림차순(동률 시 파일명 오름차순) 으로 정렬된 DataSource 페이지
     */
    @Query(
            value = """
                    SELECT ds
                    FROM DataSource ds
                    LEFT JOIN ds.analysisFlows af
                    WHERE ds.user.id = :userId
                    GROUP BY ds.id
                    ORDER BY COUNT(af) DESC, ds.fileName ASC
                    """,
            countQuery = "SELECT COUNT(ds) FROM DataSource ds WHERE ds.user.id = :userId"
    )
    Page<DataSource> findAllByUserIdOrderByUsageDesc(@Param("userId") Long userId, Pageable pageable);
}
