Feature: Analytics Dashboard User Experience

  As an enterprise client evaluating web development capabilities
  I want to interact with a sophisticated analytics dashboard demo
  So that I can assess the technical expertise and UI/UX quality

  Background:
    Given I am viewing the analytics dashboard demo page
    And the page has finished loading all components

  Scenario: Dashboard displays real-time metrics
    When I arrive on the dashboard
    Then I should see current user count with trending indicator
    And I should see today's revenue with percentage change
    And I should see server response time metrics
    And I should see system uptime percentage
    And all metrics should update automatically every 5 seconds

  Scenario: Interactive chart data visualization
    When I view the user activity chart
    Then I should see a 24-hour trend line visualization
    And the chart should display smooth animated transitions
    When I view the weekly revenue chart  
    Then I should see bar chart data for 7 days
    And each bar should represent daily revenue totals

  Scenario: System performance monitoring
    When I examine the system performance section
    Then I should see CPU usage percentage with animated progress bar
    And I should see memory usage percentage with animated progress bar
    And I should see network I/O percentage with animated progress bar
    And all progress bars should animate smoothly on page load

  Scenario: Alert management workflow
    Given there are active system alerts displayed
    When I click the resolve button on an unresolved alert
    Then the alert should be marked as resolved
    And the active alert count should decrease by one
    And the resolved alert should show a strikethrough style
    And the resolve button should no longer be visible for that alert

  Scenario: Timeframe selection affects data display
    Given the default timeframe is "Last 24 Hours"
    When I change the timeframe dropdown to "Last 7 Days"
    Then the timeframe selection should update immediately
    And the chart data should reflect the new time period
    When I change the timeframe to "Last Hour" 
    Then the data granularity should adjust accordingly

  Scenario: Manual data refresh functionality
    When I click the refresh button
    Then the button should show a loading state
    And the refresh icon should display a spinning animation
    And the button should be disabled during refresh
    When the refresh completes
    Then all dashboard metrics should update with new values
    And the button should return to its normal enabled state

  Scenario: Responsive design across devices
    When I view the dashboard on a mobile device (375px width)
    Then the metric cards should stack vertically
    And the charts should remain readable and interactive
    And the navigation should be accessible
    When I view the dashboard on a tablet (768px width)
    Then the layout should adapt to a 2-column grid
    When I view the dashboard on desktop (1200px+ width)
    Then the full 4-column layout should be visible

  Scenario: Accessibility and keyboard navigation
    When I use keyboard navigation only
    Then I should be able to tab through all interactive elements
    And the timeframe dropdown should be keyboard accessible
    And the refresh button should be keyboard accessible
    And focus indicators should be clearly visible
    When I use a screen reader
    Then all charts should have appropriate ARIA labels
    And metric values should be announced properly

  Scenario: Performance under load
    When multiple users access the dashboard simultaneously
    Then the real-time updates should remain smooth
    And animations should not cause performance degradation
    And memory usage should remain stable
    When I leave the dashboard idle for extended periods
    Then the page should continue updating without memory leaks

  Scenario: Error handling and resilience
    When the data refresh encounters a temporary error
    Then the dashboard should display cached data gracefully  
    And error states should be handled without breaking the UI
    When network connectivity is intermittent
    Then the refresh mechanism should retry with exponential backoff

  Scenario: Advanced interaction patterns
    When I hover over chart elements
    Then tooltips should display detailed metric information
    When I interact with the alert resolution system
    Then changes should be reflected immediately in the UI
    And the alert count should update in real-time
    When I rapidly interact with multiple controls
    Then the interface should remain responsive and stable

  Scenario: Visual design and branding excellence
    Then the dashboard should display a professional dark theme
    And color coding should be consistent (blue for neutral, green for positive, red for negative)
    And animations should be smooth and purposeful
    And the typography should be clear and readable
    And the overall design should convey enterprise-grade quality
    And the "built by [Company]" branding should be prominently displayed

  Scenario: Technical showcase demonstration
    Then the footer should highlight key technologies used
    And the demo should showcase React 19 + Next.js capabilities
    And Framer Motion animations should be evident throughout
    And TypeScript type safety should be demonstrated
    And responsive Tailwind CSS styling should be apparent
    And real-time update capabilities should be functioning
    And advanced data visualization techniques should be visible

  Scenario: Demo navigation and context
    Given I arrived from the main portfolio page
    Then I should see a clear demo banner indicating this is a showcase
    And there should be a prominent "Close Demo" button
    When I click the "Close Demo" button
    Then I should return to the main portfolio page
    When I click the company name link in the demo banner
    Then I should navigate back to the portfolio overview