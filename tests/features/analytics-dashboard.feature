Feature: Analytics Dashboard Demo
  As an enterprise client evaluating web development capabilities
  I want to interact with the analytics dashboard demo
  So that I can assess the technical expertise and UI/UX quality

  # These scenarios assert the demo's actual, observable behaviour as rendered in
  # a jsdom environment (DOM structure, interactions, and state changes). Purely
  # visual / runtime concerns from the original aspirational spec — animation
  # smoothness, true responsive layout, screen-reader announcements, network
  # retry/backoff — are not asserted here because they cannot be verified
  # deterministically without a real browser.

  Background:
    Given I am viewing the analytics dashboard demo page

  Scenario: Dashboard displays the key metric cards
    Then I should see the "Active Users" metric
    And I should see the "Revenue Today" metric
    And I should see the "Server Response" metric
    And I should see the "Uptime" metric
    And each metric card should show a percentage change indicator

  Scenario: Charts and performance section render
    Then I should see the "User Activity (24h)" chart
    And the user activity chart should render an SVG line
    And I should see the "Weekly Revenue" chart
    And the system performance section should show "CPU Usage", "Memory Usage", and "Network I/O" with progress bars

  Scenario: Resolving an active alert updates the UI
    Given the dashboard shows 2 active alerts
    When I resolve the alert "High memory usage on server-3"
    Then that alert should be shown with a strikethrough style
    And the alert should no longer show a resolve button
    And the active alert count should decrease to 1

  Scenario: Selecting a timeframe updates the dropdown
    Given the default timeframe is "Last 24 Hours"
    When I change the timeframe to "Last 7 Days"
    Then the timeframe dropdown value should be "7d"

  Scenario: Manual data refresh toggles the loading state
    When I click the refresh button
    Then the refresh button should be disabled
    And the refresh icon should show a spinning animation
    When the refresh completes
    Then the refresh button should be enabled again

  Scenario: Demo banner provides portfolio navigation
    Then I should see a "LIVE DEMO" banner crediting "Aetheris Vision"
    And there should be a "Close Demo" control linking to the portfolio
    And the company name should link to the portfolio

  Scenario: Technical showcase footer lists the technologies used
    Then the footer should highlight "Enterprise Dashboard Capabilities"
    And the footer should list "React 19 + Next.js"
    And the footer should list "Framer Motion"
    And the footer should list "TypeScript"
    And the footer should list "Tailwind CSS"
    And the footer should list "Data Visualization"

  Scenario: Dashboard uses a dark theme with a responsive metric grid
    Then the dashboard root should use a dark gradient background
    And the metric grid should use responsive column classes
