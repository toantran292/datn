package com.example.demo.issue;

import com.example.demo.issue.dto.IssueRequest;
import com.example.demo.issue.dto.IssueResponse;
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
public class IssueController {

    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    @PostMapping("/issues")
    public ResponseEntity<IssueResponse> create(@Valid @RequestBody IssueRequest request) {
        IssueResponse response = issueService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/issues/{id}")
    public IssueResponse findById(@PathVariable UUID id) {
        return issueService.findById(id);
    }

    @GetMapping("/projects/{projectId}/issues")
    public List<IssueResponse> findByProject(@PathVariable UUID projectId) {
        return issueService.findByProject(projectId);
    }

    @GetMapping("/sprints/{sprintId}/issues")
    public List<IssueResponse> findBySprint(@PathVariable UUID sprintId) {
        return issueService.findBySprint(sprintId);
    }

    @PutMapping("/issues/{id}")
    public IssueResponse update(@PathVariable UUID id, @Valid @RequestBody IssueRequest request) {
        return issueService.update(id, request);
    }

    @DeleteMapping("/issues/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        issueService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
