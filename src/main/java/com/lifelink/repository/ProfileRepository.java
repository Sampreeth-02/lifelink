package com.lifelink.repository;

import com.lifelink.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    List<Profile> findByStatus(String status);
    java.util.Optional<Profile> findByUserId(Long userId);
}
