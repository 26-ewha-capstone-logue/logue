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
 * CSV 바이트 스트림에서 간단한 미리보기 표 데이터(헤더/행)를 추출하는 경량 파서.
 *
 * <p>본 이슈(#31) 범위에서 고도화된 CSV 파서는 사용하지 않으며,
 * 따옴표(")로 감싼 값과 이스케이프된 따옴표(""), 콤마 구분자만 최소 지원합니다.</p>
 */
@Slf4j
@Component
public class CsvPreviewExtractor {

    /** 미리보기에 포함할 최대 행 수. */
    public static final int DEFAULT_PREVIEW_ROWS = 100;

    /**
     * CSV 스트림에서 {@link FilePreview}·행/컬럼 수를 추출합니다.
     *
     * @param input       CSV 바이트 입력 스트림
     * @param maxPreviewRows preview 에 담을 최대 행 수
     * @return 추출된 preview 및 전체 통계
     */
    public ExtractResult extract(InputStream input, int maxPreviewRows) {
        List<String> headers = new ArrayList<>();
        List<List<String>> previewRows = new ArrayList<>();
        long totalRows = 0;

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
                totalRows++;
                if (previewRows.size() < maxPreviewRows) {
                    previewRows.add(parseCsvLine(line));
                }
            }
        } catch (IOException e) {
            log.error("[CsvPreviewExtractor] read failed", e);
            throw new LogueException(ErrorCode.DATASOURCE_STORAGE_ERROR);
        }

        if (headers.isEmpty()) {
            throw new LogueException(ErrorCode.DATASOURCE_INVALID_FILE);
        }

        return new ExtractResult(
                new FilePreview(Collections.unmodifiableList(headers), Collections.unmodifiableList(previewRows)),
                totalRows,
                headers.size()
        );
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

    /**
     * 추출 결과.
     *
     * @param preview     미리보기 표 데이터
     * @param totalRows   전체 데이터 행 수 (헤더 제외)
     * @param columnCount 컬럼 수 (헤더 기준)
     */
    public record ExtractResult(FilePreview preview, long totalRows, int columnCount) {
    }
}
