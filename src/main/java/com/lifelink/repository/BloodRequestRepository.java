package com.lifelink.repository;

import com.lifelink.model.BloodRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {
    List<BloodRequest> findByTypeOrderByCreatedAtDesc(String type);
    List<BloodRequest> findByBankNameAndBloodGroupAndType(String bankName, String bloodGroup, String type);
}
