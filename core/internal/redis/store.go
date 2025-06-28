package redis

import (
	"context"
	"errors"
	"log"

	"github.com/parthkapoor-dev/core/models"
	"github.com/parthkapoor-dev/core/pkg/dotenv"
	"github.com/redis/go-redis/v9"
)

type Redis struct {
	client *redis.Client
	ctx    context.Context
}

var REDIS_URL = dotenv.EnvString("REDIS_URL", "")

func NewRedisStore() *Redis {

	ctx := context.Background()
	opt, _ := redis.ParseURL(REDIS_URL)
	client := redis.NewClient(opt)

	_, err := client.Ping(ctx).Result()
	if err != nil {
		log.Printf("❌ Failed to connect to Redis: %v", err)
	}

	log.Println("✅ Connected to Redis")

	return &Redis{
		client: client,
		ctx:    ctx,
	}
}

// Helper Functinos
func (r *Redis) CreateRepl(username, replName, replID string) error {
	if err := r.client.HSet(r.ctx, "repl:"+replID, map[string]string{
		"id":       replID,
		"name":     replName,
		"user":     username,
		"isActive": "false",
	}).Err(); err != nil {
		return err
	}

	if err := r.client.SAdd(r.ctx, "user:"+username, replID).Err(); err != nil {
		return err
	}

	return nil
}

func (r *Redis) GetRepl(replID string) (models.Repl, error) {

	data, err := r.client.HGetAll(r.ctx, "repl:"+replID).Result()
	if err != nil {
		return models.Repl{}, err
	}

	if len(data) == 0 {
		return models.Repl{}, errors.New("No such Repl Found")
	}

	repl := models.Repl{
		Id:       replID,
		Name:     data["name"],
		User:     data["user"],
		IsActive: data["isActive"] == "true",
	}

	return repl, nil
}

// user-repl relationship
func (r *Redis) CreateUserRepl(username, replID string) error {
	return r.client.SAdd(r.ctx, "user:"+username, replID).Err()
}

func (r *Redis) GetUserRepls(username string) ([]string, error) {
	return r.client.SMembers(r.ctx, "user:"+username).Result()
}

// Repl Session
func (r *Redis) CreateReplSession(replID string) error {
	if err := r.client.SAdd(r.ctx, "sessions", replID).Err(); err != nil {
		return err
	}

	return r.client.HSet(r.ctx, "repl:"+replID, "isActive", "true").Err()
}

func (r *Redis) GetReplSession(replID string) ([]string, error) {
	return r.client.SMembers(r.ctx, "sessions").Result()
}

func (r *Redis) DeleteReplSession(replID string) (int64, error) {
	val, err := r.client.SRem(r.ctx, "sessions", replID).Result()
	if err != nil {
		return val, err
	}

	if err := r.client.HSet(r.ctx, "repl:"+replID, "isActive", "false").Err(); err != nil {
		return val, err
	}

	return val, nil
}
