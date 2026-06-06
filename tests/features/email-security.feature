Feature: Email Anti-Scraping Security
  As a site operator
  I want email addresses never exposed in server-rendered HTML
  So that scrapers and spam bots cannot harvest them

  Scenario: EmailLink renders without any address in the DOM
    Given the EmailLink component is rendered with default props
    Then the rendered HTML should not contain "@aetherisvision"
    And the rendered HTML should not contain "mailto:"
    And the anchor href attribute should be "#"

  Scenario: EmailLink assembles the contact address only on click
    Given the EmailLink component is rendered with default props
    When the user clicks the link
    Then window.location.href should equal "mailto:contact@aetherisvision.com"

  Scenario: EmailLink assembles the federal POC address on click when account is marston
    Given the EmailLink component is rendered with account "marston"
    When the user clicks the link
    Then window.location.href should equal "mailto:marston@aetherisvision.com"

  Scenario: EmailLink encodes a subject into the mailto on click
    Given the EmailLink component is rendered with subject "Blog Subscription"
    When the user clicks the link
    Then window.location.href should equal "mailto:contact@aetherisvision.com?subject=Blog%20Subscription"

  Scenario: Footer does not expose the business email as plaintext
    Given the Footer component is rendered
    Then the rendered HTML should not contain "@aetherisvision"

  Scenario: Privacy page does not expose the business email as plaintext
    Given the privacy page content is rendered
    Then the rendered HTML should not contain "@aetherisvision"
