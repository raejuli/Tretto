package com.tretto.auth;

import com.tretto.auth.dto.AuthResponse;
import com.tretto.auth.dto.LoginRequest;
import com.tretto.auth.dto.RegisterRequest;
import com.tretto.exception.TrettoException;
import com.tretto.user.User;
import com.tretto.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResult register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new TrettoException("Email already in use", HttpStatus.CONFLICT);
        }

        User user = User.builder()
                .email(request.getEmail())
                .displayName(request.getDisplayName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = refreshTokenService.createRefreshToken(user);

        return new AuthResult(buildResponse(user, accessToken), rawRefreshToken);
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (AuthenticationException e) {
            throw new TrettoException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new TrettoException("User not found", HttpStatus.NOT_FOUND));

        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = refreshTokenService.createRefreshToken(user);

        return new AuthResult(buildResponse(user, accessToken), rawRefreshToken);
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        User user = refreshTokenService.validateAndRotate(rawRefreshToken);
        String newRawRefreshToken = refreshTokenService.createRefreshToken(user);
        String accessToken = jwtService.generateAccessToken(user);
        return new AuthResult(buildResponse(user, accessToken), newRawRefreshToken);
    }

    @Transactional
    public void logout(User user, String rawRefreshToken) {
        refreshTokenService.revokeToken(rawRefreshToken);
    }

    private AuthResponse buildResponse(User user, String accessToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .build();
    }

    public record AuthResult(AuthResponse response, String rawRefreshToken) {}
}
