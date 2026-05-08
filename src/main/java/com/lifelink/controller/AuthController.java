package com.lifelink.controller;

import com.lifelink.model.Role;
import com.lifelink.model.User;
import com.lifelink.model.Profile;
import com.lifelink.repository.UserRepository;
import com.lifelink.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(request.getPassword()) && user.getRole() == request.getRole()) {
                java.util.Map<String, Object> responseData = new java.util.HashMap<>();
                responseData.put("id", user.getId());
                responseData.put("username", user.getUsername());
                responseData.put("role", user.getRole());
                if (user.getProfile() != null) {
                    java.util.Map<String, Object> profileMap = new java.util.HashMap<>();
                    profileMap.put("bloodGroup", user.getProfile().getBloodGroup());
                    profileMap.put("latitude", user.getProfile().getLatitude());
                    profileMap.put("longitude", user.getProfile().getLongitude());
                    responseData.put("profile", profileMap);
                }
                return ResponseEntity.ok(responseData);
            }
        }
        return ResponseEntity.status(401).body("Invalid credentials or role");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());
        
        userRepository.save(user);
        
        java.util.Map<String, Object> responseData = new java.util.HashMap<>();
        responseData.put("id", user.getId());
        responseData.put("username", user.getUsername());
        responseData.put("role", user.getRole());
        
        return ResponseEntity.ok(responseData);
    }

    @PostMapping("/{userId}/profile")
    public ResponseEntity<?> createProfile(@PathVariable Long userId, @RequestBody Profile profile) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        profile.setUser(user);
        profileRepository.save(profile);
        
        return ResponseEntity.ok(profile);
    }
}

class LoginRequest {
    private String username;
    private String password;
    private Role role;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}

class RegisterRequest {
    private String username;
    private String password;
    private Role role;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
