package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
	"vaine-backend/utils"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const userIDKey contextKey = "user_id"

var jwtSecret = []byte("your_super_secret_key_change_this")

func (a *App) authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		// Expecting format: "Bearer <token>"
		tokenString := ""
		fmt.Sscanf(authHeader, "Bearer %s", &tokenString)
		if tokenString == "" {
			http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Ensure signing method is HMAC
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// JWT numbers are decoded as float64 by default
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			http.Error(w, "Invalid user ID in token", http.StatusUnauthorized)
			return
		}

		userID := int(userIDFloat)

		// Store user_id in the request context
		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next(w, r.WithContext(ctx))
	}
}

func generateJWT(userID int) string {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		log.Printf("JWT generation error: %v", err)
		return ""
	}

	return tokenString
}

type ArgumentInput struct {
	Content string `json:"content"`
}

type RegisterInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type User struct {
	Id             int
	Email          string
	HashedPassword string
}

type ArgumentResponse struct {
	ID         int    `json:"id"`
	Author     string `json:"author"`
	Title      string `json:"title"`
	Content    string `json:"content"`
	LogicScore int    `json:"logic_score"`
	CreatedAt  string `json:"created_at"`
}

func (a *App) handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	if err := a.DB.Ping(); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Engine: online, Connection: lost"))
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Engine: online, DB: connected"))
}

func (a *App) handleCreateArgument(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input ArgumentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || input.Content == "" {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	query := `
	INSERT INTO arguments (content, user_id) VALUES ($1, $2) RETURNING id, created_at`
	var id int
	var createdAt string

	err := a.DB.QueryRow(query, input.Content, userID).Scan(&id, &createdAt)
	if err != nil {
		log.Printf("Database insert error: %v", err)
		http.Error(w, "Failed to save argument", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, `{"message": "Saved", "id": %d}`, id)
}

func (a *App) handleGetArguments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := `
        SELECT id, user_id, title, content, logic_score, created_at 
        FROM arguments 
        ORDER BY created_at DESC
    `
	rows, err := a.DB.Query(query)
	if err != nil {
		log.Printf("Fetch error: %v", err)
		http.Error(w, "Failed to fetch arguments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	arguments := []ArgumentResponse{}

	for rows.Next() {
		var arg ArgumentResponse
		var rawUserID int
		if err := rows.Scan(&arg.ID, &rawUserID, &arg.Title, &arg.Content, &arg.LogicScore, &arg.CreatedAt); err != nil {
			continue
		}

		// Dynamically map real user_id to a secure randomized alias
		arg.Author = fmt.Sprintf("ANONYMOUS_DEV_%d", (rawUserID*31)%900+100)

		arguments = append(arguments, arg)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Row iteration error: %v", err)
		http.Error(w, "Failed to fetch arguments", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(arguments)
}

func (a *App) handleRegister(w http.ResponseWriter, r *http.Request) {

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input RegisterInput
	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	if input.Email == "" || input.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	securedEmail, err := utils.Aes(input.Email)
	if err != nil {
		log.Printf("Email AES error: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		log.Printf("Password hashing error: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	query := `INSERT INTO users (email, email_encrypted, password_hash) VALUES ($1, $2, $3) RETURNING id, created_at`
	var id int
	var createdAt time.Time

	err = a.DB.QueryRow(query, input.Email, securedEmail, hashedPassword).Scan(&id, &createdAt)
	if err != nil {
		log.Printf("Database insert error: %v", err)
		http.Error(w, "Email might already be taken", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, `{"message": "User registered successfully", "id": %d}`, id)
}

func (a *App) handleLogin(w http.ResponseWriter, r *http.Request) {

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds RegisterInput
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var user User
	query := "SELECT id, email, password_hash FROM users WHERE email = $1"

	err = a.DB.QueryRow(query, creds.Email).Scan(&user.Id, &user.Email, &user.HashedPassword)

	if err == sql.ErrNoRows {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	IsValid := utils.CheckPassword(creds.Password, user.HashedPassword)
	if !IsValid {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	tokenString := generateJWT(user.Id)
	if tokenString == "" {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login successful!",
		"token":   tokenString,
	})
}

func EnableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
