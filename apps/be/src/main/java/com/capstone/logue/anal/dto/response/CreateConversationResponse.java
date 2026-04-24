package com.capstone.logue.anal.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

public record CreateConversationResponse (

    Long conversationId,

    OffsetDateTime createdAt
) {}
