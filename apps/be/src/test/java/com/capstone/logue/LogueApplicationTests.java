package com.capstone.logue;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// #294: 테스트 환경에 Postgres datasource 가 없어 컨텍스트 로딩이 실패한다.
// Testcontainers 도입 후 @Disabled 제거 예정.
@Disabled("#294 - 테스트 datasource 셋업 후 활성화")
@SpringBootTest
class LogueApplicationTests {

	@Test
	void contextLoads() {
	}

}
