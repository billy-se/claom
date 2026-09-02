package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
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

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader || tokenString == "" {
			http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
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

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			http.Error(w, "Invalid user ID in token", http.StatusUnauthorized)
			return
		}

		userID := int(userIDFloat)

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
	Title   string `json:"title"`
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
	ID         int             `json:"id"`
	Author     string          `json:"author"`
	Title      string          `json:"title"`
	Content    string          `json:"content"`
	LogicScore int             `json:"logic_score"`
	CreatedAt  string          `json:"created_at"`
	Comments   []*CommentInput `json:"comments"`
}

type AuditResponse struct {
	Score  int    `json:"score"`
	Review string `json:"review"`
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

func cleanJSONResponse(input string) string {
	input = strings.TrimSpace(input)
	input = strings.TrimPrefix(input, "```json")
	input = strings.TrimPrefix(input, "```")
	input = strings.TrimSuffix(input, "```")
	return strings.TrimSpace(input)
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

	botResponseText, err := CallBotAgent(input.Content)
	var score int = 50
	var reviewContent = "Automated security audit failed to generate review."

	if err == nil {
		var audit AuditResponse
		cleanedJSON := cleanJSONResponse(botResponseText)
		if json.Unmarshal([]byte(cleanedJSON), &audit) == nil {
			score = audit.Score
			reviewContent = audit.Review
		} else {
			reviewContent = botResponseText
		}
	} else {
		log.Printf("Bot agent call error: %v", err)
	}

	query := `
        INSERT INTO arguments (title, content, user_id, logic_score) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, logic_score, created_at`

	var id int
	var logicScore int
	var createdAt string

	err = a.DB.QueryRow(query, input.Title, input.Content, userID, score).Scan(&id, &logicScore, &createdAt)
	if err != nil {
		log.Printf("Database insert error: %v", err)
		http.Error(w, "Failed to save argument", http.StatusInternalServerError)
		return
	}

	if reviewContent != "" {
		commentQuery := `INSERT INTO comments (argument_id, user_id, content) VALUES ($1, NULL, $2)`
		_, commentErr := a.DB.Exec(commentQuery, id, reviewContent)
		if commentErr != nil {
			log.Printf("Failed to save bot review comment: %v", commentErr)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "Saved",
		"id":          id,
		"logic_score": logicScore,
		"created_at":  createdAt,
	})
}

/*botResponse, err := CallBotAgent(input.Content)
if err != nil {
	fmt.Println("Bot failed to respond:", err)
} else {
	commentQuery := `INSERT INTO comments (argument_id, content, user_id) VALUES ($1, $2, $3)`

	_, err = a.DB.Exec(commentQuery, id, botResponse, 0)
	if err != nil {
		log.Printf("Failed to save bot comment: %v", err)
	}
}*/

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

		arg.Author = fmt.Sprintf("ANONYMOUS_DEV_%d", (rawUserID*31)%900+100)

		commentQuery := `
            SELECT id, user_id, parent_id, content, created_at 
            FROM comments 
            WHERE argument_id = $1 
            ORDER BY created_at ASC
        `
		commentRows, err := a.DB.Query(commentQuery, arg.ID)
		if err != nil {
			arg.Comments = []*CommentInput{}
			arguments = append(arguments, arg)
			continue
		}

		var flatComments []CommentInput
		for commentRows.Next() {
			var cID int64
			var cUserID sql.NullInt32
			var parentID sql.NullInt64
			var content string
			var createdAt string

			if err := commentRows.Scan(&cID, &cUserID, &parentID, &content, &createdAt); err == nil {
				var pID *int64
				if parentID.Valid {
					val := parentID.Int64
					pID = &val
				}

				var authorStr string
				if cUserID.Valid {
					authorStr = fmt.Sprintf("ANONYMOUS_DEV_%d", (int(cUserID.Int32)*31)%900+100)
				} else {
					authorStr = "BOT_REVIEWER"
				}

				flatComments = append(flatComments, CommentInput{
					ID:        fmt.Sprintf("%d", cID),
					ParentID:  pID,
					Author:    authorStr,
					Text:      content,
					Timestamp: createdAt,
					Replies:   []*CommentInput{},
				})
			} else {
				log.Printf("Comment scan error: %v", err)
			}
		}
		commentRows.Close()

		if err := commentRows.Err(); err != nil {
			log.Printf("Comment row iteration error: %v", err)
		}

		commentMap := make(map[string]*CommentInput)
		var rootComments []*CommentInput

		for i := range flatComments {
			commentMap[flatComments[i].ID] = &flatComments[i]
		}

		for i := range flatComments {
			comment := &flatComments[i]
			if comment.ParentID == nil {
				rootComments = append(rootComments, comment)
			} else {
				parentIDStr := fmt.Sprintf("%d", *comment.ParentID)
				if parent, exists := commentMap[parentIDStr]; exists {
					parent.Replies = append(parent.Replies, comment)
				} else {
					rootComments = append(rootComments, comment)
				}
			}
		}

		var finalRootComments []CommentInput
		for _, rc := range rootComments {
			finalRootComments = append(finalRootComments, *rc)
		}

		if finalRootComments == nil {
			arg.Comments = []*CommentInput{}
		} else {
			arg.Comments = rootComments
		}

		arguments = append(arguments, arg)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Row iteration error: %v", err)
		http.Error(w, "Failed to fetch arguments", http.StatusInternalServerError)
		return
	}

	if arguments == nil {
		arguments = []ArgumentResponse{}
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
		log.Printf("Database insert errorrr: %v", err)
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

type CommentInput struct {
	ID         string          `json:"id,omitempty"`
	ArgumentID int64           `json:"argument_id,omitempty"`
	ParentID   *int64          `json:"parent_id,omitempty"`
	Content    string          `json:"content,omitempty"`
	Author     string          `json:"author,omitempty"`
	Text       string          `json:"text,omitempty"`
	Timestamp  string          `json:"timestamp,omitempty"`
	Replies    []*CommentInput `json:"replies,omitempty"`
}

func (a *App) handleCreateComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input CommentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || input.Content == "" {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	query := `
        INSERT INTO comments (argument_id, parent_id, user_id, content)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at`

	var id int64
	var createdAt string

	err := a.DB.QueryRow(query, input.ArgumentID, input.ParentID, userID, input.Content).Scan(&id, &createdAt)
	if err != nil {
		log.Printf("Database insert error: %v", err)
		http.Error(w, "Failed to save comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "Comment saved",
		"id":         id,
		"created_at": createdAt,
	})
}

func EnableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, PATCH, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("X-Content-Type-Options", "nosniff")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
