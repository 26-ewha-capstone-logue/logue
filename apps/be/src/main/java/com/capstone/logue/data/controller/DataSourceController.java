package com.capstone.logue.data.controller;

import com.capstone.logue.data.dto.GetFileResponse;
import com.capstone.logue.data.dto.UploadFileResponse;
import com.capstone.logue.data.service.DataSourceService;
import com.capstone.logue.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * DataSource CRUD REST 엔드포인트.
 *
 * <p>인증 모듈이 도입되기 전까지 사용자 식별은 임시로 {@code X-User-Id} 요청 헤더로 전달받습니다.
 * 추후 이슈에서 {@code Authorization: Bearer &lt;accessToken&gt;} 기반 인증으로 교체됩니다.</p>
 */
@Tag(name = "DataSource", description = "CSV 데이터 소스 업로드/조회/삭제 API")
@RestController
@RequestMapping("/api/datasources")
@RequiredArgsConstructor
public class DataSourceController {

    private final DataSourceService dataSourceService;

    /**
     * CSV 파일을 업로드하여 DataSource 를 생성합니다.
     *
     * @param userId 요청 사용자 id (임시 헤더, 추후 인증으로 교체)
     * @param file   업로드할 CSV 파일
     * @return 생성된 DataSource id 포함 응답
     */
    @Operation(
            summary = "CSV 파일 업로드",
            description = "multipart/form-data 로 CSV 파일을 업로드하고 DataSource 를 생성합니다.",
            requestBody = @RequestBody(
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(implementation = UploadFormSchema.class),
                            encoding = @Encoding(name = "file", contentType = "text/csv")
                    )
            )
    )
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UploadFileResponse> upload(
            @Parameter(description = "요청 사용자 id (임시)", example = "1")
            @RequestHeader("X-User-Id") Long userId,
            @RequestPart("file") MultipartFile file
    ) {
        UploadFileResponse response = dataSourceService.upload(userId, file);
        return ApiResponse.success("CSV 파일이 업로드되었습니다.", response);
    }

    /**
     * 지정한 DataSource 단건을 조회합니다.
     *
     * @param userId       요청 사용자 id (임시 헤더)
     * @param dataSourceId 조회할 DataSource id
     * @return 파일 메타 및 미리보기 데이터를 포함한 응답
     */
    @Operation(summary = "데이터 소스 단건 조회", description = "DataSource 메타데이터와 CSV 미리보기(헤더+행)를 반환합니다.")
    @GetMapping("/{dataSourceId}")
    public ApiResponse<GetFileResponse> getOne(
            @Parameter(description = "요청 사용자 id (임시)", example = "1")
            @RequestHeader("X-User-Id") Long userId,
            @Parameter(description = "조회할 DataSource id", example = "1")
            @PathVariable Long dataSourceId
    ) {
        GetFileResponse response = dataSourceService.getOne(userId, dataSourceId);
        return ApiResponse.success("데이터 소스 조회에 성공했습니다.", response);
    }

    /**
     * 지정한 DataSource 한 건을 삭제합니다.
     */
    @Operation(summary = "데이터 소스 단건 삭제")
    @DeleteMapping("/{dataSourceId}")
    public ApiResponse<Void> deleteOne(
            @Parameter(description = "요청 사용자 id (임시)", example = "1")
            @RequestHeader("X-User-Id") Long userId,
            @Parameter(description = "삭제할 DataSource id", example = "1")
            @PathVariable Long dataSourceId
    ) {
        dataSourceService.deleteOne(userId, dataSourceId);
        return ApiResponse.success("데이터 소스를 삭제했습니다.");
    }

    /**
     * 여러 DataSource 를 한 번에 삭제합니다.
     *
     * <p>쿼리 파라미터 {@code id} 를 콤마로 구분하거나 여러 번 반복하여 전달할 수 있습니다.
     * 예: {@code ?id=1,2,3} 또는 {@code ?id=1&id=2&id=3}</p>
     */
    @Operation(summary = "데이터 소스 다건 삭제")
    @DeleteMapping
    public ApiResponse<Void> deleteMany(
            @Parameter(description = "요청 사용자 id (임시)", example = "1")
            @RequestHeader("X-User-Id") Long userId,
            @Parameter(description = "삭제할 DataSource id 리스트", example = "1,2,3")
            @RequestParam("id") List<Long> ids
    ) {
        dataSourceService.deleteMany(userId, ids);
        return ApiResponse.success("선택한 데이터 소스들을 삭제했습니다.");
    }

    /** Swagger multipart request schema 문서용 (실제 요청 바인딩에 사용되지 않음). */
    @Schema(name = "UploadFileRequest", description = "CSV 업로드 multipart 요청")
    private static class UploadFormSchema {
        @Schema(type = "string", format = "binary", description = "업로드할 CSV 파일")
        public MultipartFile file;
    }
}
