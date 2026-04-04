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

    private static final String SEPARATOR = ".";

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.refresh-token-expiry-days:7}")
    private int refreshTokenExpiryDays;

    /**
     * Creates a new refresh token. The raw token format is "selector.verifier".
     * The selector is stored in plain text for fast lookup; the verifier is bcrypt-hashed.
     */
    @Transactional
    public String createRefreshToken(User user) {
        String selector = UUID.randomUUID().toString();
        String verifier = UUID.randomUUID().toString();
        String rawToken = selector + SEPARATOR + verifier;

        RefreshToken token = RefreshToken.builder()
                .user(user)
                .selector(selector)
                .tokenHash(passwordEncoder.encode(verifier))
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpiryDays))
                .revoked(false)
                .build();
        refreshTokenRepository.save(token);
        return rawToken;
    }

    @Transactional
    public User validateAndRotate(String rawToken) {
        String[] parts = rawToken.split("\\.", 2);
        if (parts.length != 2) {
            throw new TrettoException("Invalid refresh token format", HttpStatus.UNAUTHORIZED);
        }
        String selector = parts[0];
        String verifier = parts[1];

        RefreshToken stored = refreshTokenRepository.findBySelector(selector)
                .orElseThrow(() -> new TrettoException("Invalid or expired refresh token", HttpStatus.UNAUTHORIZED));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new TrettoException("Invalid or expired refresh token", HttpStatus.UNAUTHORIZED);
        }

        if (!passwordEncoder.matches(verifier, stored.getTokenHash())) {
            // Possible token theft — revoke all tokens for this user
            refreshTokenRepository.revokeAllByUserId(stored.getUser().getId());
            throw new TrettoException("Invalid refresh token", HttpStatus.UNAUTHORIZED);
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        return stored.getUser();
    }

    @Transactional
    public void revokeToken(String rawToken) {
        String[] parts = rawToken.split("\\.", 2);
        if (parts.length != 2) return;
        String selector = parts[0];
        refreshTokenRepository.findBySelector(selector).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }
}
