package models

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestClientAndPanelJSONOmitCredentials(t *testing.T) {
	fixture := "synthetic-test-value"
	for _, model := range []any{
		User{Password: fixture, RememberToken: &fixture},
		ControlPanel{Password: fixture, CashboxToken: &fixture},
	} {
		data, err := json.Marshal(model)
		if err != nil {
			t.Fatal(err)
		}
		if strings.Contains(string(data), fixture) {
			t.Errorf("%T serialized a credential", model)
		}
	}
}
