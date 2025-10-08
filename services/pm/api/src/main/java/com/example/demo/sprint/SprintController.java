package com.example.demo.sprint;

import com.example.demo.sprint.dto.SprintRequest;
import com.example.demo.sprint.dto.SprintResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SprintController {

    private final SprintService sprintService;

    public SprintController(SprintService sprintService) {
        this.sprintService = sprintService;
    }

    @PostMapping("/sprints")
    public ResponseEntity<SprintResponse> create(@Valid @RequestBody SprintRequest request) {
        SprintResponse response = sprintService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/sprints/{id}")
    public SprintResponse findById(@PathVariable UUID id) {
        return sprintService.findById(id);
    }

    @GetMapping("/projects/{projectId}/sprints")
    public List<SprintResponse> findByProject(@PathVariable UUID projectId) {
        return sprintService.findByProject(projectId);
    }

    @PutMapping("/sprints/{id}")
    public SprintResponse update(@PathVariable UUID id, @Valid @RequestBody SprintRequest request) {
        return sprintService.update(id, request);
    }

    @DeleteMapping("/sprints/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        sprintService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
