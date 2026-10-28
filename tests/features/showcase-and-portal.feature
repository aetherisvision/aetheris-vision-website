@showcase
Feature: Public Omni-Gridder Showcase and Client Portal Access
  As a prospective consulting client or active client
  I want to explore the live Omni-Gridder showcase and securely access the client portal
  So that I can evaluate regridding compatibility and review signed engagement documents

  Scenario: Public Omni-Gridder showcase loads the dataset catalog and enforces the compatibility matrix
    Given a visitor opens the public Omni-Gridder showcase
    Then the showcase dataset picker should list "GFS 500 hPa geopotential height" and "GOES-18 ABI band 13 — clean IR window"
    When the visitor selects the "GOES-18 ABI band 13 — clean IR window" dataset
    Then the compatibility matrix should explain that swath geometry refuses bilinear interpolation

  Scenario: Public Omni-Gridder showcase surfaces a consultation link when the daily demo budget is exhausted
    Given a visitor opens the public Omni-Gridder showcase
    When the visitor starts a single regrid job after the daily demo budget is exhausted
    Then the showcase should display the daily compute budget notice with a link to "/book"

  Scenario: Client portal magic-link round-trip authenticates project and signed SOW access
    Given a client record exists for "jane.client@example.com" with a signed Statement of Work
    When the client requests and redeems a magic-link sign-in token over HTTPS
    Then the client portal session cookie should be "__Secure-authjs.session-token"
    And the authenticated client can load their project and stream the signed Statement of Work PDF
