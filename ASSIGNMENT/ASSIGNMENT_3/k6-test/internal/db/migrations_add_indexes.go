// Example Go migration helper (GORM v2 compatible). Call this during app startup migrations.
package db

import (
    "gorm.io/gorm"
)

func AddIndexes(db *gorm.DB) error {
    // Use raw exec to ensure index names and options
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles (created_at DESC)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments (article_id)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)").Error; err != nil {
        return err
    }
    return nil
}