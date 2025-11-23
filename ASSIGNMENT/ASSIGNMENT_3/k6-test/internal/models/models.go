// Example changes in models.go or database initialization to ensure indexes and pool tuning
package models

import (
    "time"
    "gorm.io/gorm"
)

type Article struct {
    ID        uint      `gorm:"primaryKey"`
    Slug      string    `gorm:"index"`
    Title     string
    Body      string
    CreatedAt time.Time `gorm:"index"`
    // ...
}

// In your DB init (after db := common.GetDB())
func AutoMigrate(db *gorm.DB) {
    User := 0
    db.AutoMigrate(&User{})
    db.AutoMigrate(&Article{})
    db.AutoMigrate(&Comment{})
    db.AutoMigrate(&Tag{})

    // If using GORM v1 AddIndex was used; with GORM v2 use Exec or Migrator.CreateIndex
    db.Exec("CREATE INDEX IF NOT EXISTS idx_article_created_at ON articles (created_at DESC)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_article_slug ON articles (slug)")
    db.Exec("CREATE INDEX IF NOT EXISTS idx_comment_article_id ON comments (article_id)")
}