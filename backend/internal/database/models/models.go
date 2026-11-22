package models

import (
	"time"
)

// PasswordReset model
type PasswordReset struct {
	Email     string     `gorm:"type:varchar(255);index;not null"`
	Token     string     `gorm:"type:varchar(255);not null"`
	CreatedAt *time.Time `gorm:"type:timestamp"`
}

func (PasswordReset) TableName() string {
	return "password_resets"
}

// PersonalAccessToken model
type PersonalAccessToken struct {
	ID            uint       `gorm:"primaryKey"`
	TokenableType string     `gorm:"type:varchar(255);not null;index:idx_tokenable"`
	TokenableID   uint       `gorm:"not null;index:idx_tokenable"`
	Name          string     `gorm:"type:varchar(255);not null"`
	Token         string     `gorm:"type:varchar(64);uniqueIndex;not null"`
	Abilities     *string    `gorm:"type:text"`
	LastUsedAt    *time.Time `gorm:"type:timestamp"`
	ExpiresAt     *time.Time `gorm:"type:timestamp"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// Tag model
type Tag struct {
	ID        uint   `gorm:"primaryKey"`
	Name      string `gorm:"type:varchar(255);not null"`
	Color     string `gorm:"type:varchar(255);not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Admin model
type Admin struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	Firstname      string    `gorm:"type:varchar(255);not null" json:"firstname"`
	Lastname       string    `gorm:"type:varchar(255);not null" json:"lastname"`
	Email          string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	Phone          string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"phone"`
	Password       string    `gorm:"type:varchar(255);not null" json:"-"`
	RoleID         uint      `gorm:"not null" json:"role_id"`
	Role           Role      `gorm:"foreignKey:RoleID;constraint:OnDelete:RESTRICT" json:"role"`
	SpecialCardUID *string   `gorm:"type:varchar(255);unique" json:"special_card_uid"` // ДОДАНО
	IsActive       bool      `gorm:"default:true;not null" json:"is_active"`            // ДОДАНО
	RememberToken  *string   `gorm:"type:varchar(100)" json:"-"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// User model
type User struct {
	ID            uint    `gorm:"primaryKey"`
	Firstname     string  `gorm:"type:varchar(255);not null"`
	Lastname      string  `gorm:"type:varchar(255);not null"`
	Email         string  `gorm:"type:varchar(255);uniqueIndex;not null"`
	Phone         string  `gorm:"type:varchar(255);uniqueIndex;not null"`
	Password      string  `gorm:"type:varchar(255);not null"`
	TagID         *uint   `gorm:"default:null"`
	Tag           *Tag    `gorm:"foreignKey:TagID;constraint:OnDelete:SET NULL"`
	RememberToken *string `gorm:"type:varchar(100)"`
	Balance       float64 `gorm:"type:decimal(10,2);default:0.00" json:"balance"` // ДОБАВЛЕНО
	Tags          string  `gorm:"type:text" json:"tags"`                          // ДОБАВЛЕНО
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// CardGroup model
type CardGroup struct {
	ID         uint    `gorm:"primaryKey"`
	UserID     uint    `gorm:"uniqueIndex;not null"`
	User       User    `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Name       string  `gorm:"type:varchar(255);not null"`
	Balance    float64 `gorm:"type:decimal(8,2);not null"`
	Discount   int     `gorm:"default:0;not null"`
	LimitDay   *string `gorm:"type:varchar(255)"`
	LimitWeek  *string `gorm:"type:varchar(255)"`
	LimitMonth *string `gorm:"type:varchar(255)"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// Card model
type Card struct {
	ID                 uint       `gorm:"primaryKey" json:"id"`
	Name               *string    `gorm:"type:varchar(255)" json:"name"`
	Type               string     `gorm:"type:enum('default','group','master');default:'default';not null" json:"type"`
	UID                string     `gorm:"type:varchar(255);uniqueIndex;not null" json:"uid"`
	CardGroupID        *uint      `gorm:"default:null" json:"card_group_id"`
	CardGroup          *CardGroup `gorm:"foreignKey:CardGroupID;constraint:OnDelete:SET NULL" json:"card_group,omitempty"`
	Amount             float64    `gorm:"type:decimal(10,2);default:0;not null" json:"amount"`
	UserID             *uint      `gorm:"default:null" json:"user_id"`
	User               *User      `gorm:"foreignKey:UserID;constraint:OnDelete:RESTRICT" json:"user,omitempty"`
	IsReceived         bool       `gorm:"default:false;not null" json:"is_received"`
	IsBlocked          bool       `gorm:"default:false;not null" json:"is_blocked"`
	Discount           int        `gorm:"default:0;not null" json:"discount"`
	Turnover           float64    `gorm:"type:decimal(10,2);default:0;not null" json:"turnover"`
	TotalReplenishment float64    `gorm:"type:decimal(10,2);default:0;not null" json:"total_replenishment"`
	WasGlobalSave      bool       `gorm:"default:false;not null" json:"was_global_save"`
	LastUsedAt         *time.Time `gorm:"type:timestamp" json:"last_used_at"` // ⬅️ ДОДАЙ ЦЕ ПОЛЕ
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// Session model
type Session struct {
	ID           string  `gorm:"type:varchar(255);primaryKey"`
	UserID       *uint   `gorm:"index"`
	IPAddress    *string `gorm:"type:varchar(45)"`
	UserAgent    *string `gorm:"type:text"`
	Payload      string  `gorm:"type:longtext;not null"`
	LastActivity int     `gorm:"index;not null"`
}

// ServiceProgram model
type ServiceProgram struct {
	ID        uint   `gorm:"primaryKey"`
	Name      string `gorm:"type:varchar(255);not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Program model
type Program struct {
	ID        uint    `gorm:"primaryKey"`
	Name      string  `gorm:"type:varchar(255);not null"`
	Desc      string  `gorm:"type:text;not null"`
	Image     *string `gorm:"type:varchar(255)"`
	Price     float64 `gorm:"type:decimal(10,2);not null"`
	Cost      float64 `gorm:"type:decimal(10,2);not null"`
	PriceType string  `gorm:"type:enum('liter','minute','pulse');not null"`
	CanDelete bool    `gorm:"default:true;not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// CarWash model
type CarWash struct {
	ID                       uint    `gorm:"primaryKey"`
	Name                     string  `gorm:"type:varchar(255);not null"`
	UID                      uint64  `gorm:"type:bigint unsigned;not null"`
	Address                  string  `gorm:"type:varchar(255);not null"`
	Coordinates              *string `gorm:"type:longtext"`
	FiskSkip                 int     `gorm:"default:0;not null"`
	Theme                    string  `gorm:"type:varchar(255);default:'dark';not null"`
	ThemeAutoSwitch          bool    `gorm:"default:false;not null"`
	DarkThemeActivationTime  *string `gorm:"type:time"`
	LightThemeActivationTime *string `gorm:"type:time"`
	ChatID                   *int64  `gorm:"type:bigint;default:null"`
	IsDeWash                 string  `gorm:"type:enum('да','нет');default:'нет';not null"`
	CreatedAt                time.Time
	UpdatedAt                time.Time
}

// ControlPanel model
type ControlPanel struct {
	ID                     uint       `gorm:"primaryKey"`
	Login                  string     `gorm:"type:varchar(255);uniqueIndex;not null"`
	Password               string     `gorm:"type:varchar(255);not null"`
	Link                   *string    `gorm:"type:varchar(255)"`
	TypePanel              string     `gorm:"type:enum('old','panel_v2');not null"`
	Name                   string     `gorm:"type:varchar(255);not null"`
	CarWashID              uint       `gorm:"not null"`
	CarWash                CarWash    `gorm:"foreignKey:CarWashID;constraint:OnDelete:CASCADE"`
	DayMessage             string     `gorm:"type:varchar(500);not null;default:'Усім доброго дня'"` // Изменено на varchar
	DayMessageActive       bool       `gorm:"default:true;not null"`
	DayMessageX            int        `gorm:"default:560;not null"`
	DayMessageY            int        `gorm:"default:189;not null"`
	ReadWriteMode          bool       `gorm:"default:true;not null"`
	CardholderReadMode     int        `gorm:"default:1;not null"`
	StopTimer              int        `gorm:"default:0;not null"`
	Stop                   int        `gorm:"default:0;not null"`
	RelayTimePressure      *int       `gorm:"default:null"`
	RelayDurationPressure  *int       `gorm:"default:null"`
	WithdrawMoneyOutBypass bool       `gorm:"default:false;not null"`
	MaxDurationPause       int        `gorm:"default:120;not null"`
	MaxCountPause          int        `gorm:"default:10;not null"`
	TimeStartMoney         int        `gorm:"default:0;not null"`
	TimeOffLight           int        `gorm:"default:60;not null"`
	AutoZReportTime        string     `gorm:"type:time;not null"`
	Status                 string     `gorm:"type:enum('inactive','reboot','error','active');default:'inactive';not null"`
	StatusRelay            string     `gorm:"type:enum('inactive','error','active');default:'inactive';not null"`
	TypeButton             string     `gorm:"type:enum('error','touchscreen','buttons');default:'buttons';not null"`
	ButtonsDebugMode       bool       `gorm:"default:false;not null"`
	DebugMode              bool       `gorm:"default:false;not null"`
	ActiveMode             *string    `gorm:"type:varchar(255);default:null"`
	CashboxHost            *string    `gorm:"type:varchar(255)"`
	CashboxPort            *string    `gorm:"type:varchar(255)"`
	CashboxToken           *string    `gorm:"type:varchar(255)"`
	PrinterName            *string    `gorm:"type:varchar(255)"`
	PaypassIP              *string    `gorm:"type:varchar(255)"`
	PaypassPort            *string    `gorm:"type:varchar(255)"`
	PaypassMID             *string    `gorm:"type:varchar(255)"`
	PaymentPublicKey       *string    `gorm:"type:varchar(255)"`
	PaymentPrivateKey      *string    `gorm:"type:varchar(255)"`
	UsbPortCash            string     `gorm:"type:varchar(255);default:'auto';not null"`
	UsbPortPaypass         *string    `gorm:"type:varchar(255);default:'auto'"`
	ButtonBoardPort        string     `gorm:"type:varchar(255);default:'-';not null"`
	BarCodePort            string     `gorm:"type:varchar(255);default:'-';not null"`
	LastPingAt             *time.Time `gorm:"type:timestamp;default:null"`
	CreatedAt              time.Time
	UpdatedAt              time.Time
}

// CashHolder model
type CashHolder struct {
	ID             uint         `gorm:"primaryKey"`
	UID            string       `gorm:"type:varchar(255);not null"`
	Status         string       `gorm:"type:enum('active','inactive','error');default:'inactive';not null"`
	TotalHave      int          `gorm:"default:0;not null"`
	Total          int          `gorm:"default:0;not null"`
	ControlPanelID uint         `gorm:"not null"`
	ControlPanel   ControlPanel `gorm:"foreignKey:ControlPanelID;constraint:OnDelete:CASCADE"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// Transaction model
type Transaction struct {
	ID             uint         `gorm:"primaryKey"`
	ControlPanelID uint         `gorm:"not null"`
	ControlPanel   ControlPanel `gorm:"foreignKey:ControlPanelID;constraint:OnDelete:CASCADE"`
	UserID         *uint        `gorm:"default:null"`
	User           *User        `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL"`
	UserName       *string      `gorm:"type:varchar(255)"`
	CardID         *uint        `gorm:"default:null"`
	Card           *Card        `gorm:"foreignKey:CardID;constraint:OnDelete:SET NULL"`
	CardUID        *string      `gorm:"type:varchar(255)"`
	AdminID        *uint        `gorm:"default:null"`
	Admin          *Admin       `gorm:"foreignKey:AdminID;constraint:OnDelete:SET NULL"`
	PayType        *string      `gorm:"type:enum('cash','card','paypass','brsm+','manually','qrpay','kiosk');default:null"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// TransactionProgram model
type TransactionProgram struct {
	ID              uint        `gorm:"primaryKey"`
	TransactionID   uint        `gorm:"not null"`
	Transaction     Transaction `gorm:"foreignKey:TransactionID;constraint:OnDelete:CASCADE"`
	ProgramID       *uint       `gorm:"default:null"`
	Program         *Program    `gorm:"foreignKey:ProgramID;constraint:OnDelete:SET NULL"`
	Amount          float64     `gorm:"type:decimal(10,2);not null"`
	Discount        float64     `gorm:"type:decimal(10,2);not null"`
	DiscountPerCent int         `gorm:"not null"`
}

// InfoCashHolder model - составной первичный ключ
type InfoCashHolder struct {
	CashHolderID uint       `gorm:"primaryKey;autoIncrement:false"`
	CashHolder   CashHolder `gorm:"foreignKey:CashHolderID;constraint:OnDelete:CASCADE"`
	Rating       int        `gorm:"primaryKey;autoIncrement:false;not null"`
	Count        int        `gorm:"not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// Job model
type Job struct {
	ID          uint   `gorm:"primaryKey"`
	Queue       string `gorm:"type:varchar(255);index;not null"`
	Payload     string `gorm:"type:longtext;not null"`
	Attempts    uint8  `gorm:"not null"`
	ReservedAt  *uint  `gorm:"default:null"`
	AvailableAt uint   `gorm:"not null"`
	CreatedAt   uint   `gorm:"not null"`
}

// AdminCard model
type AdminCard struct {
	ID             uint       `gorm:"primaryKey"`
	UID            string     `gorm:"type:varchar(255);not null"`
	AdminID        uint       `gorm:"not null"`
	Admin          Admin      `gorm:"foreignKey:AdminID;constraint:OnDelete:CASCADE"`
	DayLimit       *float64   `gorm:"type:decimal(10,2);default:null"`
	IsReceived     bool       `gorm:"default:false;not null"`
	DateResetLimit *time.Time `gorm:"type:timestamp;default:null"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// PanelProgram model
type PanelProgram struct {
	ID             uint         `gorm:"primaryKey"`
	ControlPanelID uint         `gorm:"not null"`
	ControlPanel   ControlPanel `gorm:"foreignKey:ControlPanelID;constraint:OnDelete:CASCADE"`
	ProgramID      uint         `gorm:"not null"`
	Program        Program      `gorm:"foreignKey:ProgramID;constraint:OnDelete:CASCADE"`
	Button         int          `gorm:"not null"`
	Bypass         int          `gorm:"default:0;not null"`
	TimeoutMoney   int          `gorm:"default:0;not null"`
	Available      bool         `gorm:"default:true;not null"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// PanelProgramRelay model
type PanelProgramRelay struct {
	ID             uint         `gorm:"primaryKey"`
	PanelProgramID uint         `gorm:"not null"`
	PanelProgram   PanelProgram `gorm:"foreignKey:PanelProgramID;constraint:OnDelete:CASCADE"`
	RelayNumber    int          `gorm:"not null"`
	TimeoutOn      int          `gorm:"default:0;not null"`
	TimeoutOff     int          `gorm:"default:0;not null"`
}

// AdminTransaction model
type AdminTransaction struct {
	ID             uint         `gorm:"primaryKey"`
	ControlPanelID uint         `gorm:"not null"`
	ControlPanel   ControlPanel `gorm:"foreignKey:ControlPanelID;constraint:OnDelete:CASCADE"`
	AdminID        uint         `gorm:"not null"`
	Admin          Admin        `gorm:"foreignKey:AdminID;constraint:OnDelete:CASCADE"`
	AdminCardID    uint         `gorm:"not null"`
	AdminCard      AdminCard    `gorm:"foreignKey:AdminCardID;constraint:OnDelete:CASCADE"`
	PayType        *string      `gorm:"type:enum('cash','card','paypass','brsm+','manually','qrpay','kiosk');default:null"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// AdminTransactionProgram model
type AdminTransactionProgram struct {
	ID                 uint             `gorm:"primaryKey"`
	AdminTransactionID uint             `gorm:"not null"`
	AdminTransaction   AdminTransaction `gorm:"foreignKey:AdminTransactionID;constraint:OnDelete:CASCADE"`
	ProgramID          uint             `gorm:"not null"`
	Program            Program          `gorm:"foreignKey:ProgramID;constraint:OnDelete:CASCADE"`
	Amount             float64          `gorm:"type:decimal(10,2);not null"`
}

// PanelServiceProgram model
type PanelServiceProgram struct {
	ID               uint           `gorm:"primaryKey"`
	ControlPanelID   uint           `gorm:"not null"`
	ControlPanel     ControlPanel   `gorm:"foreignKey:ControlPanelID;constraint:OnDelete:CASCADE"`
	ServiceProgramID uint           `gorm:"not null"`
	ServiceProgram   ServiceProgram `gorm:"foreignKey:ServiceProgramID;constraint:OnDelete:CASCADE"`
	Button           *int           `gorm:"default:null"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// PanelServiceProgramRelay model
type PanelServiceProgramRelay struct {
	ID                    uint                `gorm:"primaryKey"`
	PanelServiceProgramID uint                `gorm:"not null"`
	PanelServiceProgram   PanelServiceProgram `gorm:"foreignKey:PanelServiceProgramID;constraint:OnDelete:CASCADE"`
	RelayNumber           int                 `gorm:"not null"`
	TimeoutOn             int                 `gorm:"default:0;not null"`
	TimeoutOff            int                 `gorm:"default:0;not null"`
}

// TelegramChat model
type TelegramChat struct {
	ID        uint    `gorm:"primaryKey"`
	CarWashID uint    `gorm:"not null"`
	CarWash   CarWash `gorm:"foreignKey:CarWashID;constraint:OnDelete:CASCADE"`
	ChatID    string  `gorm:"type:varchar(255);not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// TelegramMessage model
type TelegramMessage struct {
	ID        uint   `gorm:"primaryKey"`
	Message   string `gorm:"type:varchar(1000);not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Article model
type Article struct {
	ID        uint   `gorm:"primaryKey"`
	Name      string `gorm:"type:varchar(255);not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Expense model
type Expense struct {
	ID        uint      `gorm:"primaryKey"`
	Date      time.Time `gorm:"type:datetime;not null"`
	CarWashID uint      `gorm:"not null"`
	CarWash   CarWash   `gorm:"foreignKey:CarWashID;constraint:OnDelete:CASCADE"`
	AdminID   uint      `gorm:"not null"`
	Admin     Admin     `gorm:"foreignKey:AdminID;constraint:OnDelete:CASCADE"`
	ArticleID uint      `gorm:"not null"`
	Article   Article   `gorm:"foreignKey:ArticleID;constraint:OnDelete:CASCADE"`
	Sum       int       `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Device model
type Device struct {
	ID                 uint         `gorm:"primaryKey"`
	ControlPanelID     uint         `gorm:"not null"`
	ControlPanel       ControlPanel `gorm:"foreignKey:ControlPanelID;constraint:OnDelete:CASCADE"`
	Name               string       `gorm:"type:varchar(255);not null"`
	NumberRelay        int          `gorm:"not null"`
	CurrentConsumption float64      `gorm:"type:decimal(11,6);default:0;not null"`
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// DeviceMaintenance model
type DeviceMaintenance struct {
	ID              uint    `gorm:"primaryKey"`
	DeviceID        uint    `gorm:"not null"`
	Device          Device  `gorm:"foreignKey:DeviceID;constraint:OnDelete:CASCADE"`
	Name            string  `gorm:"type:varchar(255);not null"`
	AfterHours      int     `gorm:"not null"`
	FromConsumption float64 `gorm:"type:decimal(10,2);not null"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// MaintenanceTimetable model
type MaintenanceTimetable struct {
	ID              uint         `gorm:"primaryKey"`
	ControlPanelID  uint         `gorm:"not null"`
	ControlPanel    ControlPanel `gorm:"foreignKey:ControlPanelID;constraint:OnDelete:CASCADE"`
	DeviceName      string       `gorm:"type:varchar(255);not null"`
	Name            string       `gorm:"type:varchar(255);not null"`
	PlanConsumption *float64     `gorm:"type:decimal(10,2);default:null"`
	RealConsumption *float64     `gorm:"type:decimal(10,2);default:null"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// DiscountUser model
type DiscountUser struct {
	ID        uint `gorm:"primaryKey"`
	IsAll     bool `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// SumDiscount model
type SumDiscount struct {
	ID              uint         `gorm:"primaryKey"`
	SumTransactions int          `gorm:"not null"`
	Discount        int          `gorm:"not null"`
	DiscountUserID  uint         `gorm:"not null"`
	DiscountUser    DiscountUser `gorm:"foreignKey:DiscountUserID;constraint:OnDelete:CASCADE"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// TimeDiscount model
type TimeDiscount struct {
	ID              uint         `gorm:"primaryKey"`
	FromTime        string       `gorm:"type:time;not null"`
	ToTime          string       `gorm:"type:time;not null"`
	DiscountPerCent int          `gorm:"not null"`
	DiscountUserID  uint         `gorm:"not null"`
	DiscountUser    DiscountUser `gorm:"foreignKey:DiscountUserID;constraint:OnDelete:CASCADE"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// TimeDiscountProgram model - составной первичный ключ
type TimeDiscountProgram struct {
	TimeDiscountID uint         `gorm:"primaryKey;autoIncrement:false"`
	TimeDiscount   TimeDiscount `gorm:"foreignKey:TimeDiscountID;constraint:OnDelete:CASCADE"`
	ProgramID      uint         `gorm:"primaryKey;autoIncrement:false"`
	Program        Program      `gorm:"foreignKey:ProgramID;constraint:OnDelete:CASCADE"`
}

// PayDiscount model
type PayDiscount struct {
	ID              uint         `gorm:"primaryKey"`
	Type            string       `gorm:"type:enum('paypass','cash');not null"`
	DiscountPerCent int          `gorm:"not null"`
	Status          string       `gorm:"type:enum('active','inactive');not null"`
	DiscountUserID  uint         `gorm:"not null"`
	DiscountUser    DiscountUser `gorm:"foreignKey:DiscountUserID;constraint:OnDelete:CASCADE"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// NewClientDiscount model
type NewClientDiscount struct {
	ID             uint         `gorm:"primaryKey"`
	Name           string       `gorm:"type:varchar(255);not null"`
	Discount       int          `gorm:"not null"`
	DiscountType   string       `gorm:"type:enum('per_cent','money');not null"`
	Status         string       `gorm:"type:enum('active','inactive');not null"`
	DiscountUserID uint         `gorm:"not null"`
	DiscountUser   DiscountUser `gorm:"foreignKey:DiscountUserID;constraint:OnDelete:CASCADE"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// ListGroup model - составной первичный ключ
type ListGroup struct {
	DiscountUserID uint         `gorm:"primaryKey;autoIncrement:false"`
	DiscountUser   DiscountUser `gorm:"foreignKey:DiscountUserID;constraint:OnDelete:CASCADE"`
	CardGroupID    uint         `gorm:"primaryKey;autoIncrement:false"`
	CardGroup      CardGroup    `gorm:"foreignKey:CardGroupID;constraint:OnDelete:CASCADE"`
}

// ListTag model - составной первичный ключ
type ListTag struct {
	DiscountUserID uint         `gorm:"primaryKey;autoIncrement:false"`
	DiscountUser   DiscountUser `gorm:"foreignKey:DiscountUserID;constraint:OnDelete:CASCADE"`
	TagID          uint         `gorm:"primaryKey;autoIncrement:false"`
	Tag            Tag          `gorm:"foreignKey:TagID;constraint:OnDelete:CASCADE"`
}

// AdminCardProgram model
type AdminCardProgram struct {
	ID          uint      `gorm:"primaryKey"`
	AdminCardID uint      `gorm:"not null"`
	AdminCard   AdminCard `gorm:"foreignKey:AdminCardID;constraint:OnDelete:CASCADE"`
	ProgramID   uint      `gorm:"not null"`
	Program     Program   `gorm:"foreignKey:ProgramID;constraint:OnDelete:CASCADE"`
}

// Payment model
type Payment struct {
	ID             uint          `gorm:"primaryKey"`
	CardID         *uint         `gorm:"default:null"`
	Card           *Card         `gorm:"foreignKey:CardID;constraint:OnDelete:SET NULL"`
	CardGroupID    *uint         `gorm:"default:null"`
	CardGroup      *CardGroup    `gorm:"foreignKey:CardGroupID;constraint:OnDelete:SET NULL"`
	ControlPanelID *uint         `gorm:"default:null"`
	ControlPanel   *ControlPanel `gorm:"foreignKey:ControlPanelID;constraint:OnDelete:SET NULL"`
	Amount         float64       `gorm:"type:decimal(10,2);not null"`
	Discount       float64       `gorm:"type:decimal(10,2);default:0;not null"`
	Type           string        `gorm:"type:enum('card','default');not null"`
	PayType        string        `gorm:"type:enum('paypass','cash','manually','qrpay','kiosk');not null"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// Replenishment model
type Replenishment struct {
	ID        uint    `gorm:"primaryKey"`
	AdminName string  `gorm:"type:varchar(255);not null"`
	AdminID   *uint   `gorm:"default:null"`
	Admin     *Admin  `gorm:"foreignKey:AdminID;constraint:OnDelete:SET NULL"`
	Amount    float64 `gorm:"type:decimal(10,2);not null"`
	UserName  string  `gorm:"type:varchar(255);not null"`
	UserID    *uint   `gorm:"default:null"`
	User      *User   `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL"`
	CardID    *uint   `gorm:"default:null"`
	Card      *Card   `gorm:"foreignKey:CardID;constraint:OnDelete:SET NULL"`
	Desc      string  `gorm:"type:text;not null"`
	PayType   string  `gorm:"type:enum('paypass','cash','none');default:'none';not null"`
	IsChecked bool    `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// TimeDiscountDay model - составной первичный ключ
type TimeDiscountDay struct {
	TimeDiscountID uint         `gorm:"primaryKey;autoIncrement:false"`
	TimeDiscount   TimeDiscount `gorm:"foreignKey:TimeDiscountID;constraint:OnDelete:CASCADE"`
	NumberDay      int16        `gorm:"primaryKey;autoIncrement:false;not null"`
}

// CarWashAdmin model - связь многие-ко-многим
type CarWashAdmin struct {
	ID        uint    `gorm:"primaryKey"`
	CarWashID uint    `gorm:"not null"`
	CarWash   CarWash `gorm:"foreignKey:CarWashID;constraint:OnDelete:CASCADE"`
	AdminID   uint    `gorm:"not null"`
	Admin     Admin   `gorm:"foreignKey:AdminID;constraint:OnDelete:CASCADE"`
}

// Incasation model
type Incasation struct {
	ID                 uint      `gorm:"primaryKey"`
	AdminID            uint      `gorm:"not null"`
	Admin              Admin     `gorm:"foreignKey:AdminID;constraint:OnDelete:RESTRICT"`
	IncasationDatetime time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP;not null"`
	IncasationSource   string    `gorm:"type:varchar(255);not null"`
	TotalAmount        float64   `gorm:"type:decimal(10,2);not null"`
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// AdminStatistic model
type AdminStatistic struct {
	ID              uint      `gorm:"primaryKey"`
	AdminName       string    `gorm:"type:varchar(255);not null"`
	PayType         string    `gorm:"type:varchar(255);not null"`
	Amount          float64   `gorm:"type:decimal(10,2);not null"`
	TransactionDate time.Time `gorm:"type:date;not null"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// PromoTemplate model
type PromoTemplate struct {
	ID        uint      `gorm:"primaryKey"`
	Name      string    `gorm:"type:varchar(255);not null"`
	StartAt   time.Time `gorm:"type:datetime;not null"`
	EndAt     time.Time `gorm:"type:datetime;not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Promo model
type Promo struct {
	ID            uint           `gorm:"primaryKey"`
	Title         *string        `gorm:"type:varchar(255)"`
	TemplateID    *uint          `gorm:"default:null"`
	PromoTemplate *PromoTemplate `gorm:"foreignKey:TemplateID;constraint:OnDelete:SET NULL"`
	ImagePath     *string        `gorm:"type:varchar(255)"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// PromoPanel model
type PromoPanel struct {
	ID             uint         `gorm:"primaryKey"`
	PromoID        uint         `gorm:"not null"`
	Promo          Promo        `gorm:"foreignKey:PromoID;constraint:OnDelete:CASCADE"`
	ControlPanelID uint         `gorm:"not null"`
	ControlPanel   ControlPanel `gorm:"foreignKey:ControlPanelID;constraint:OnDelete:CASCADE"`
	PromoPath      *string      `gorm:"type:varchar(255)"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// ClientPayDiscount model
type ClientPayDiscount struct {
	ID              uint         `gorm:"primaryKey"`
	Type            string       `gorm:"type:enum('paypass','cash');not null"`
	DiscountPerCent int          `gorm:"not null"`
	Status          string       `gorm:"type:enum('active','inactive');not null"`
	DiscountUserID  uint         `gorm:"not null"`
	DiscountUser    DiscountUser `gorm:"foreignKey:DiscountUserID;constraint:OnDelete:CASCADE"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// KassaPayment model
type KassaPayment struct {
	ID                   uint         `gorm:"primaryKey"`
	ControlPanelID       uint         `gorm:"not null"`
	ControlPanel         ControlPanel `gorm:"foreignKey:ControlPanelID;constraint:OnDelete:RESTRICT"`
	CardUID              *uint64      `gorm:"type:bigint unsigned;default:null"`
	Amount               uint64       `gorm:"type:bigint unsigned;not null"`
	KassaTransactionUUID *string      `gorm:"type:varchar(255)"`
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

// ServiceSetting model
type ServiceSetting struct {
	ID        uint `gorm:"primaryKey"`
	Promo     bool `gorm:"default:true;not null"`
	BrsmPlus  bool `gorm:"default:true;not null"`
	FiskSkip  bool `gorm:"default:false;not null"`
	Qrpay     bool `gorm:"default:false;not null"`
	Kiosk     bool `gorm:"default:false;not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// CardsGroupLimitSpent model
type CardsGroupLimitSpent struct {
	CardID          uint    `gorm:"primaryKey;autoIncrement:false"`
	Card            Card    `gorm:"foreignKey:CardID;constraint:OnDelete:CASCADE"`
	DayLimitSpent   float64 `gorm:"type:decimal(10,2);default:0;not null"`
	WeekLimitSpent  float64 `gorm:"type:decimal(10,2);default:0;not null"`
	MonthLimitSpent float64 `gorm:"type:decimal(10,2);default:0;not null"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// LimitReset model
type LimitReset struct {
	ID          uint      `gorm:"primaryKey"`
	Type        int8      `gorm:"type:tinyint;uniqueIndex;not null"` // 1:day, 2:week, 3:month
	LastResetAt time.Time `gorm:"type:datetime;not null"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// KassaTransaction model
type KassaTransaction struct {
	ID             uint         `gorm:"primaryKey"`
	Type           int8         `gorm:"type:tinyint;not null"`
	Amount         float64      `gorm:"type:decimal(10,2);not null"`
	DiscountAmount float64      `gorm:"type:decimal(10,2);not null"`
	KassaPaymentID uint         `gorm:"not null"`
	KassaPayment   KassaPayment `gorm:"foreignKey:KassaPaymentID;constraint:OnDelete:CASCADE"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// PaymentSystem model
type PaymentSystem struct {
	ID        uint   `gorm:"primaryKey"`
	Name      string `gorm:"type:varchar(255);not null"`
	Status    int8   `gorm:"type:tinyint;default:0;not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// FailedJob model
type FailedJob struct {
	ID         uint      `gorm:"primaryKey"`
	UUID       string    `gorm:"type:varchar(255);uniqueIndex;not null"`
	Connection string    `gorm:"type:text;not null"`
	Queue      string    `gorm:"type:text;not null"`
	Payload    string    `gorm:"type:longtext;not null"`
	Exception  string    `gorm:"type:longtext;not null"`
	FailedAt   time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP;not null"`
}
// AdminResponse - структура для відповіді API
type AdminResponse struct {
	ID             uint      `json:"id"`
	Firstname      string    `json:"firstname"`
	Lastname       string    `json:"lastname"`
	Email          string    `json:"email"`
	Phone          string    `json:"phone"`
	RoleID         uint      `json:"role_id"`
	Role           string    `json:"role"`
	SpecialCardUID *string   `json:"special_card_uid"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// ToResponse конвертує Admin в AdminResponse
func (a *Admin) ToResponse() AdminResponse {
	roleName := ""
	if a.Role.Name != "" {
		roleName = a.Role.Name
	}
	
	return AdminResponse{
		ID:             a.ID,
		Firstname:      a.Firstname,
		Lastname:       a.Lastname,
		Email:          a.Email,
		Phone:          a.Phone,
		RoleID:         a.RoleID,
		Role:           roleName,
		SpecialCardUID: a.SpecialCardUID,
		IsActive:       a.IsActive,
		CreatedAt:      a.CreatedAt,
		UpdatedAt:      a.UpdatedAt,
	}
}
// ============================================================================
// ДОДАТИ ЦІ СТРУКТУРИ ТА МЕТОДИ В КІНЕЦЬ ФАЙЛУ internal/database/models/models.go
// ============================================================================

// CardResponse - структура для відповіді API (для веб-інтерфейсу)
type CardResponse struct {
	ID         uint       `json:"id"`
	UID        string     `json:"uid"`
	Amount     float64    `json:"amount"`
	ClientName string     `json:"client_name"` // Ім'я клієнта
	IsBlocked  bool       `json:"is_blocked"`
	Discount   int        `json:"discount"`
	LastUsedAt *time.Time `json:"last_used_at"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

// ToResponse конвертує Card в CardResponse
func (c *Card) ToResponse() CardResponse {
	clientName := "Не встановлено"
	if c.User != nil {
		clientName = c.User.Firstname + " " + c.User.Lastname
	}

	return CardResponse{
		ID:         c.ID,
		UID:        c.UID,
		Amount:     c.Amount,
		ClientName: clientName,
		IsBlocked:  c.IsBlocked,
		Discount:   c.Discount,
		LastUsedAt: c.LastUsedAt,
		CreatedAt:  c.CreatedAt,
		UpdatedAt:  c.UpdatedAt,
	}
}
// ============================================================================
// СТАТИСТИКА - ДОДАЙТЕ ЦІ МОДЕЛІ В КІНЕЦЬ ФАЙЛУ
// ============================================================================

// DailyStats - щоденна статистика
type DailyStats struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Date      time.Time `gorm:"type:date;uniqueIndex" json:"date"`
	Profit    float64   `gorm:"type:decimal(10,2);default:0" json:"profit"`
	Expenses  float64   `gorm:"type:decimal(10,2);default:0" json:"expenses"`
	Balance   float64   `gorm:"type:decimal(10,2);default:0" json:"balance"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (DailyStats) TableName() string {
	return "daily_stats"
}

// MonthlyStats - місячна статистика для графіків
type MonthlyStats struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Year      int       `gorm:"index" json:"year"`
	Month     int       `gorm:"index" json:"month"`
	Profit    float64   `gorm:"type:decimal(10,2);default:0" json:"profit"`
	Expenses  float64   `gorm:"type:decimal(10,2);default:0" json:"expenses"`
	Balance   float64   `gorm:"type:decimal(10,2);default:0" json:"balance"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (MonthlyStats) TableName() string {
	return "monthly_stats"
}

// PaymentMethodStats - статистика по методах оплати
type PaymentMethodStats struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Date      time.Time `gorm:"type:date;index" json:"date"`
	Method    string    `gorm:"type:varchar(50)" json:"method"` // cash, card, paypass
	Count     int       `gorm:"default:0" json:"count"`
	Amount    float64   `gorm:"type:decimal(10,2);default:0" json:"amount"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (PaymentMethodStats) TableName() string {
	return "payment_method_stats"
}

// ClientStats - статистика по клієнтах
type ClientStats struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	Date           time.Time `gorm:"type:date;index" json:"date"`
	NewClients     int       `gorm:"default:0" json:"new_clients"`
	RegularClients int       `gorm:"default:0" json:"regular_clients"`
	TotalClients   int       `gorm:"default:0" json:"total_clients"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (ClientStats) TableName() string {
	return "client_stats"
}

// TransactionStats - статистика транзакцій
type TransactionStats struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Date      time.Time `gorm:"type:date;index" json:"date"`
	Type      string    `gorm:"type:varchar(50)" json:"type"` // cash, card, paypass
	Amount    float64   `gorm:"type:decimal(10,2);default:0" json:"amount"`
	Count     int       `gorm:"default:0" json:"count"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (TransactionStats) TableName() string {
	return "transaction_stats"
}

// Activity - журнал активності для дашборду
type Activity struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Type        string    `gorm:"type:varchar(50)" json:"type"` // success, warning, info
	Icon        string    `gorm:"type:varchar(10)" json:"icon"`
	Description string    `gorm:"type:varchar(255)" json:"description"`
	Time        time.Time `gorm:"index" json:"time"`
	CreatedAt   time.Time `json:"created_at"`
}

func (Activity) TableName() string {
	return "activities"
}