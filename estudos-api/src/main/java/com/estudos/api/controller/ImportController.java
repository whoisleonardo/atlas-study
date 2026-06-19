package com.estudos.api.controller;

import com.estudos.api.dto.ImportResultDTO;
import com.estudos.api.service.CsvImportService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/import")
public class ImportController {

    private final CsvImportService service;

    public ImportController(CsvImportService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportResultDTO> importarCsv(@RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(service.importar(file.getInputStream()));
    }
}
