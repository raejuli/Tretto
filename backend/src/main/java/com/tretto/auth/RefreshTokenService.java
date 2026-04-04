package com.tretto.auth;

import com.tretto.exception.TrettoException;
import com.tretto.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.refresh-token-expiry-days:7}")
    private int refreshTokenExpiryDays;

    @Transactional
    public String createRefreshToken(User user, String rawToken) {
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .tokenHash(passwordEncoder.encode(rawToken))
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpiryDays))
                .revoked(false)
                .build();
        refreshTokenRepository.save(token);
        return rawToken;
    }

    @Transactional
    public User validateAndRotate(String rawToken, String newRawToken) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findAll().stream()
                .filter(t -> !t.isRevoked()
                        && t.getExpiresAt().isAfter(LocalDateTime.now())
                        && passwordEncoder.matches(rawToken, t.getTokenHash()))
                .toList();

        if (activeTokens.isEmpty()) {
            throw new TrettoException("Invalid or expired refresh token", HttpStatus.UNAUTHORIZED);
        }

        RefreshToken found = activeTokens.get(0);
        found.setRevoked(true);
        refreshTokenRepository.save(found);

        User user = found.getUser();
        createRefreshToken(user, newRawToken);
        return user;
    }

    @Transactional
    public void revokeForUser(User user, String rawToken) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findByUserIdAndRevokedFalse(user.getId());
        activeTokens.stream()
                .filter(t -> passwordEncoder.matches(rawToken, t.getTokenHash()))
                .forEach(t -> {
                    t.setRevoked(true);
                    refreshTokenRepository.save(t);
                });
    }
}
