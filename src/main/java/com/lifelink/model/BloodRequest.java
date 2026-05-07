package com.lifelink.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blood_requests")
public class BloodRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String bloodGroup;
    private String bankName;
    private Double latitude;
    private Double longitude;
    private String type; // 'REQUEST' or 'AVAILABLE'
    private LocalDateTime createdAt;

    public BloodRequest() {
        this.createdAt = LocalDateTime.now();
    }

    public BloodRequest(String bloodGroup, String bankName, Double latitude, Double longitude, String type) {
        this.bloodGroup = bloodGroup;
        this.bankName = bankName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.type = type;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
