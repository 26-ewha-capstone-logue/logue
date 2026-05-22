package com.capstone.logue.data.repository;

import com.capstone.logue.global.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * DataSource 업로드 시 사용자 참조용 최소 조회 리포지토리.
 *
 * <p>전용 사용자 도메인 모듈이 도입되기 전까지 DataSource CRUD 구현만을 위해
 * 사용되는 임시 리포지토리입니다. 별도 사용자 도메인 리포지토리가 만들어지면
 * 제거되거나 교체될 수 있습니다.</p>
 */
public interface UserLookupRepository extends JpaRepository<User, Long> {
}
