package com.capstone.logue.anal.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class CreateConversationResponse {

    private Long conversationId;

    private OffsetDateTime createdAt;
}
