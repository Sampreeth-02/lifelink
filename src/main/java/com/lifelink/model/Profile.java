package com.lifelink.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String bloodGroup;
    
    private String status; // e.g. AVAILABLE, UNAVAILABLE
    
    private Double latitude;
    
    private Double longitude;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    public Profile() {}

    public Profile(Long id, String bloodGroup, String status, Double latitude, Double longitude, User user) {
        this.id = id;
        this.bloodGroup = bloodGroup;
        this.status = status;
        this.latitude = latitude;
        this.longitude = longitude;
        this.user = user;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
