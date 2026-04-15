package com.capstone.logue.global.entity;

import com.capstone.logue.global.entity.base.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Logue 서비스를 사용하는 사용자 정보를 저장하는 엔티티입니다.
 *
 * <p>소셜 로그인(Google OAuth2)을 통해 인증되며,
 * {@code providerUserId}를 기준으로 동일 사용자를 식별합니다.</p>
 *
 * <p>{@code domain}, {@code frequentWork}, {@code dataTool}은 온보딩 과정에서 수집되는
 * 사용자 업무 컨텍스트 정보로, 분석 질문 이해도 향상에 활용됩니다.</p>
 */
@Getter
@Entity
@Table(name = "users")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 사용자 이메일. */
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    /** 소셜 로그인 제공자가 발급한 사용자 고유 식별 번호. 로그인 시 동일 사용자 판별에 사용됩니다. */
    @Column(name = "provider_user_id", nullable = false, length = 255)
    private String providerUserId;

    /** 사용자 닉네임. */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /** 로그인 제공자. 현재 GOOGLE 고정입니다. */
    @Column(name = "provider", nullable = false, length = 30)
    private String provider;

    /** 프로필 이미지 URL. 소셜 로그인 제공자로부터 받은 이미지 주소입니다. */
    @Column(name = "profile_image_url", length = 255)
    private String profileImageUrl;

    /** 온보딩용. 사용자가 주로 담당하는 업무 도메인 (예: 마케팅, 영업). */
    @Column(name = "domain", length = 255)
    private String domain;

    /** 온보딩용. 사용자가 자주 확인하는 업무 (예: 매출 현황, 이탈율). */
    @Column(name = "frequent_work", length = 255)
    private String frequentWork;

    /** 온보딩용. 사용자가 평소 사용하는 데이터 툴 (예: Excel, Tableau). */
    @Column(name = "data_tool", length = 255)
    private String dataTool;

    /** 이 사용자가 업로드한 데이터 소스 목록. */
    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<DataSource> dataSources = new ArrayList<>();

    /** 이 사용자가 참여한 대화 목록. */
    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Conversation> conversations = new ArrayList<>();
}
