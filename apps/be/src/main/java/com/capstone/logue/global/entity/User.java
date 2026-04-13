package com.capstone.logue.global.entity;

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
 */
@Getter
@Entity
@Table(name = "users")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "provider_user_id", nullable = false, length = 255)
    private String providerUserId;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "provider", nullable = false, length = 30)
    private String provider;

    @Column(name = "profile_image_url", length = 255)
    private String profileImageUrl;

    @Column(name = "domain", length = 255)
    private String domain;

    @Column(name = "frequent_work", length = 255)
    private String frequentWork;

    @Column(name = "data_tool", length = 255)
    private String dataTool;

    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<DataSource> dataSources = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Conversation> conversations = new ArrayList<>();
}
