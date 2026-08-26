package utils

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func Aes(email string) (string, error) {
	cmd := exec.Command("python", "utils/aes.py", email)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("python error: %s", stderr.String())
	}

	encryptedResult := strings.TrimSpace(out.String())
	return encryptedResult, nil
}
