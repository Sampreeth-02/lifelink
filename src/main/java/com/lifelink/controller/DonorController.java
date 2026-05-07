package com.lifelink.controller;

import com.lifelink.model.Profile;
import com.lifelink.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/donors")
public class DonorController {

    @Autowired
    private ProfileRepository profileRepository;

    @GetMapping
    public List<Profile> getAvailableDonors() {
        return profileRepository.findByStatus("AVAILABLE");
    }
}
