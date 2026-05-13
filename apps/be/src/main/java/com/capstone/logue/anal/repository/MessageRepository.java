package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByAnalysisFlowIdOrderByCreatedAtAsc(Long analysisFlowId);
}
