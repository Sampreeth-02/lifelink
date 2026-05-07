package com.lifelink.controller;

import com.lifelink.model.BloodRequest;
import com.lifelink.repository.BloodRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    @Autowired
    private BloodRequestRepository bloodRequestRepository;

    @GetMapping
    public List<BloodRequest> getActiveRequests() {
        return bloodRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public BloodRequest createRequest(@RequestBody BloodRequest request) {
        return bloodRequestRepository.save(request);
    }
}
