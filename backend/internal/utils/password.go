
package utils

import (
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword создаёт bcrypt-хеш пароля.
func HashPassword(password string) (string, error) {
	if password == "" {
		return "", errors.New("password cannot be empty")
	}

	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		12,
	)

	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hash), nil
}

// CheckPassword проверяет пароль.
// Сохраняет совместимость с существующим auth.go.
func CheckPassword(password, hash string) bool {
	return CheckPasswordDetailed(password, hash) == nil
}

// CheckPasswordDetailed позволяет определить причину ошибки.
func CheckPasswordDetailed(password, hash string) error {
	if hash == "" {
		return errors.New("password hash is empty")
	}

	err := bcrypt.CompareHashAndPassword(
		[]byte(hash),
		[]byte(password),
	)

	if err != nil {
		return fmt.Errorf("password verification failed: %w", err)
	}

	return nil
}
