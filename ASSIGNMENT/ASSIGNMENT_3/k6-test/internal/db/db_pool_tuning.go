// Example DB pool tuning (call after opening DB connection)
package db

import (
    "time"
    "gorm.io/gorm"
)

func TuneDBPool(gormDB *gorm.DB) error {
    sqlDB, err := gormDB.DB()
    if err != nil {
        return err
    }
    // Tune these values according to your DB capacity
    sqlDB.SetMaxOpenConns(100)               // total open connections
    sqlDB.SetMaxIdleConns(25)                // idle
    sqlDB.SetConnMaxLifetime(5 * time.Minute)
    return nil
}