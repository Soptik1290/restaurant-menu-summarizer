describe('App Component E2E Test', () => {

  // Runs before every test in this block
  beforeEach(() => {
    // Mocked API response returned by the backend for summarization
    const mockMenuResponse = {
      restaurant_name: 'Testovací Restaurace (z Cypressu)',
      date: '2025-10-29',
      daily_menu: true,
      menu_items: [
        { category: 'polévka', name: 'Testovací Polévka', price: 50 },
        { category: 'hlavni jidlo', name: 'Testovací Hlavní Chod', price: 150 },
      ],
      source_url: 'http://example.com',
    };

    // Intercept must EXACTLY match the URL used in App.tsx
    // Note: no "/api" prefix in the client request
    cy.intercept('POST', 'http://localhost:3001/menu/summarize', {
      statusCode: 200,
      body: mockMenuResponse,
    }).as('getMenu');

    // Load the app; baseUrl is configured in cypress.config.ts
    cy.visit('/');
    });
    
  // Main flow: fill the form, submit, and verify mocked results
  it('should load the form, submit a URL, and display the mocked results', () => {
    // 1) Ensure header is visible
    cy.contains('h1', 'Restaurant Menu Summarizer').should('be.visible');

    // 2) Type into the URL input identified by placeholder
    cy.get('input[placeholder="https://www.example-restaurant.cz/menu"]')
      .should('be.visible')
      .type('http://example.com');

    // 3) Submit the form
    cy.get('button[type="submit"]').click();

    // 4) The form fades out; assert presence rather than visibility
    cy.get('input[placeholder="https://www.example-restaurant.cz/menu"]').should('exist');

    // 5) Wait for the intercepted API call to complete
    cy.wait('@getMenu');

    // 6) Verify the submitted URL appears in the pill
    cy.contains('http://example.com').should('be.visible');

    // 7) Verify mocked results are rendered
    cy.contains('h2', 'Testovací Restaurace (z Cypressu)').should('be.visible');
    cy.contains('Testovací Polévka').should('be.visible');
    cy.contains('150,-').should('be.visible');
  });

});

