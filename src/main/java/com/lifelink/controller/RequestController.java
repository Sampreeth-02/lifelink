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
    public List<BloodRequest> getRequests(@RequestParam(defaultValue = "REQUEST") String type) {
        return bloodRequestRepository.findByTypeOrderByCreatedAtDesc(type);
    }

    @Autowired
    private com.lifelink.repository.UserRepository userRepository;

    @Autowired
    private com.lifelink.repository.ProfileRepository profileRepository;

    @PostMapping
    public BloodRequest createRequest(@RequestBody BloodRequest request) {
        if (request.getType() == null) {
            request.setType("REQUEST");
        }
        
        // Auto-populate coordinates from Bank's profile if missing or 0
        if (request.getBankName() != null && (request.getLatitude() == null || request.getLatitude() == 0.0)) {
            com.lifelink.model.User bankUser = userRepository.findByUsername(request.getBankName()).orElse(null);
            if (bankUser != null) {
                com.lifelink.model.Profile profile = profileRepository.findByUserId(bankUser.getId()).orElse(null);
                if (profile != null && profile.getLatitude() != null) {
                    request.setLatitude(profile.getLatitude());
                    request.setLongitude(profile.getLongitude());
                }
            }
        }
        
        return bloodRequestRepository.save(request);
    }
}
