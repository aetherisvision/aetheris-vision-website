Feature: Contact Form
  As a potential client visiting the Aetheris Vision website
  I want to submit a contact form
  So that I can reach the team about a web project

  # ── API layer ──────────────────────────────────────────────────────────────

  Scenario: Visitor submits a valid contact request
    Given the contact API is configured with Formspree
    When a visitor submits the form with name "Jane Doe" email "jane@example.com" and message "Need a custom website for my business"
    Then the submission should be forwarded to Formspree
    And the response status should be 200

  Scenario: Bot triggers the honeypot
    Given the contact API is configured with Formspree
    When a bot submits the form with the honeypot field filled
    Then the response status should be 200
    And the submission should not be forwarded to Formspree

  Scenario: Rate limiting kicks in after too many requests
    Given the contact API is configured with Formspree
    When 6 submissions come from the same IP address
    Then the 6th response status should be 429

  Scenario: Form configuration missing
    Given Formspree is not configured
    When a visitor submits the form with name "Test" email "test@test.com" and message "Hello"
    Then the response status should be 503

  # ── UI validation layer ────────────────────────────────────────────────────

  Scenario: Empty form shows inline required field errors
    Given a visitor is on the contact page
    When they click submit without filling in any fields
    Then they should see "Name is required."
    And they should see "Valid email address required."
    And they should see "Message must be at least 10 characters."

  Scenario: Error clears when field is corrected
    Given a visitor has triggered the name validation error
    When they type a valid name
    Then the name error should disappear

  Scenario: Invalid email format shows error
    Given a visitor fills in name and message correctly
    When they enter an invalid email address
    And they click submit
    Then they should see "Valid email address required."

  Scenario: Short message shows error
    Given a visitor fills in name and email correctly
    When they enter a message shorter than 10 characters
    And they click submit
    Then they should see "Message must be at least 10 characters."

  Scenario: Successful submission shows confirmation
    Given a visitor fills in all required fields correctly
    When the API responds with success
    Then they should see "Message Received"

  Scenario: API failure shows error message
    Given a visitor fills in all required fields correctly
    When the API responds with a server error
    Then they should see an error message with contact instructions
