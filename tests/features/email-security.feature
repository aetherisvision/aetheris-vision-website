@email
Feature: Email Anti-Scraping Security
  As a site operator
  I want no email address exposed anywhere in the rendered HTML
  So that scrapers and spam bots cannot harvest a business address

  # Contact is now routed entirely through the /contact form, so no page
  # renders a mailto: link or a plaintext address at all. This is a stronger
  # anti-scraping guarantee than the previous click-to-assemble approach.

  Scenario: Footer does not expose any email address or mailto link
    Given the Footer component is rendered
    Then the rendered HTML should not contain "@aetherisvision"
    And the rendered HTML should not contain "mailto:"

  Scenario: Footer routes contact through the /contact page
    Given the Footer component is rendered
    Then a link to "/contact" should be present

  Scenario: Privacy page does not expose any email address or mailto link
    Given the privacy page content is rendered
    Then the rendered HTML should not contain "@aetherisvision"
    And the rendered HTML should not contain "mailto:"

  Scenario: Privacy page routes contact through the /contact page
    Given the privacy page content is rendered
    Then a link to "/contact" should be present
