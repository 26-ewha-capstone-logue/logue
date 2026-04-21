package com.capstone.logue.data.service;

import com.capstone.logue.data.dto.FilePreview;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * CSV 바이트 스트림에서 헤더와 전체 행 데이터를 추출하는 경량 파서.
 *
 * <p>본 이슈(#31) 범위에서 고도화된 CSV 파서는 사용하지 않으며,
 * 따옴표(")로 감싼 값과 이스케이프된 따옴표(""), 콤마 구분자만 최소 지원합니다.</p>
 */
@Slf4j
@Component
public class CsvParser {

    /**
     * CSV 스트림을 파싱해 헤더·행 전체가 담긴 {@link FilePreview} 를 반환합니다.
     *
     * @param input CSV 바이트 입력 스트림
     * @return 파싱된 표 데이터
     */
    public FilePreview parse(InputStream input) {
        List<String> headers;
        List<List<String>> rows = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new LogueException(ErrorCode.DATASOURCE_INVALID_FILE);
            }
            headers = parseCsvLine(headerLine);

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isEmpty()) {
                    continue;
                }
                rows.add(parseCsvLine(line));
            }
        } catch (IOException e) {
            log.error("[CsvParser] read failed", e);
            throw new LogueException(ErrorCode.DATASOURCE_STORAGE_ERROR);
        }

        if (headers.isEmpty()) {
            throw new LogueException(ErrorCode.DATASOURCE_INVALID_FILE);
        }

        return new FilePreview(Collections.unmodifiableList(headers), Collections.unmodifiableList(rows));
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        current.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current.append(c);
                }
            } else {
                if (c == ',') {
                    values.add(current.toString());
                    current.setLength(0);
                } else if (c == '"') {
                    inQuotes = true;
                } else {
                    current.append(c);
                }
            }
        }
        values.add(current.toString());
        return values;
    }
}
