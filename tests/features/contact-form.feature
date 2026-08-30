Feature: Contact Form
  As a potential client visiting the Aetheris Vision website
  I want to submit a contact form
  So that I can reach the team about a project

  Scenario: Empty form shows inline required field errors
    Given a visitor is on the contact page
    When they click submit without filling in any fields
    Then they should see "Name is required."
    And they should see "Email address is required."
    And they should see "Message is required."

  Scenario: Error clears when field is corrected
    Given a visitor has triggered the name validation error
    When they type a valid name
    Then the name error should disappear

  Scenario: Invalid email format shows error
    Given a visitor fills in name and message correctly
    When they enter an invalid email address
    And they click submit
    Then they should see "Enter a valid email address."

  Scenario: Short message shows error
    Given a visitor fills in name and email correctly
    When they enter a message shorter than 10 characters
    And they click submit
    Then they should see "Message must be at least 10 characters."

  Scenario: Verified submission shows confirmation
    Given a visitor fills in all required fields correctly
    When the API starts email verification
    Then they should see "Enter the Six-Digit Code"
    And they should not see "Message Received"
    When they enter confirmation code "123456"
    And the API confirms the verified submission
    Then they should see "Message Received"

  Scenario: Unexpected successful response fails closed
    Given a visitor fills in all required fields correctly
    When the API responds with an unexpected success payload
    Then they should see "The service returned an unexpected response."
    And they should not see "Message Received"

  Scenario: API failure shows error message
    Given a visitor fills in all required fields correctly
    When the API responds with a server error
    Then they should see an error message with contact instructions
