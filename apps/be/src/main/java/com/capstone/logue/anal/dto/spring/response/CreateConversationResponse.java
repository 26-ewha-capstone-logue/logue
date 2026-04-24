package com.capstone.logue.anal.dto.spring.response;

import java.time.OffsetDateTime;

public record CreateConversationResponse (

    Long conversationId,

    OffsetDateTime createdAt
) {}
