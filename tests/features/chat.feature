Feature: AI Chat Widget
  As a site visitor
  I want to interact with the AI chat assistant
  So that I can get quick answers about Aetheris Vision's services

  Background:
    Given I am on the home page
    And the chat widget is visible

  Scenario: Opening and closing the chat widget
    When I click the chat toggle button
    Then the chat panel should be open
    When I click the chat close button
    Then the chat panel should be closed

  Scenario: Sending a message and receiving a response
    When I click the chat toggle button
    And I type "What services do you offer?" into the chat input
    And I submit the message
    Then my message should appear in the chat history
    And I should see a streaming response from the assistant

  Scenario: Chat input is disabled while a response is streaming
    When I click the chat toggle button
    And I type "Tell me about your pricing" into the chat input
    And I submit the message
    Then the send button should be disabled while the response is loading
    And the input field should be disabled while the response is loading

  Scenario: Message input enforces character limit
    When I click the chat toggle button
    And I type a message longer than 500 characters into the chat input
    Then the input should be truncated to 500 characters
    And the submit button should be enabled

  Scenario: Empty messages cannot be submitted
    When I click the chat toggle button
    And the chat input is empty
    Then the send button should be disabled

  Scenario: Rate limit error is handled gracefully
    Given the API responds with a 429 rate limit error
    When I click the chat toggle button
    And I type "Hello" into the chat input
    And I submit the message
    Then an error message should be displayed in the chat
    And the chat input should be re-enabled

  Scenario: Conversation history is maintained across turns
    When I click the chat toggle button
    And I send the message "What is your background in meteorology?"
    And I wait for the response
    And I send the message "Can you elaborate on the AI weather models?"
    Then both messages should appear in the chat history
    And both responses should appear in the chat history

  Scenario: Chat clears on reset
    When I click the chat toggle button
    And I send the message "Hello"
    And I wait for the response
    And I click the clear chat button
    Then the chat history should be empty
    And a welcome message should be displayed
