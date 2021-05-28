/**
 * Functions to create a notification in the ui
 *
 * * Responsibilities:
 *  - Create notification
 */

/**
 * Global namespace definition.
 */
var npmFaves = npmFaves || {};

(function () {
  // Namespace definition
  this.ui = this.ui || {};

  this.ui.notificationTypes = {
    INFO: "npmf_notification-info",
    SUCCESS: "npmf_notification-success",
    WARN: "npmf_notification-warning",
    ERROR: "npmf_notification-error",
  };

  /**
   * Returns the notification html
   * @param {string} message The message to display
   * @returns {string} the generated html for the notification
   */
  const getNotificationHtml = function (message) {
    let html = `<span id="npmfNotificationCloseButton" class="npmf_notification-close">
      &times;
    </span>
    <span id="npmfNotificationMessage">${message}</span>`;

    return html;
  };

  /**
   * Creates the notification.
   * @param {object} notificationType The type of notification
   * @param {string} message The message to display
   * @param {boolean} forPopUp Indicates if the notification is for the pop up.
   * If false it is for the content page
   */
  this.ui.createNotification = function (notificationType, message, forPopUp) {
    // Check if notification already exists
    const notificationNode = document.getElementById("npmfNotification");
    
    // Get the notification content
    notificationNode.innerHTML = getNotificationHtml(message);
    // Sets the message type. The main css class depends on the destination
    let elementClass = forPopUp
      ? "npmf_notification"
      : "npmf_notification_site";

    // If the type is defined its appended to the class attribute
    elementClass += notificationType ? " " + notificationType : "";
    notificationNode.className = elementClass;

    const newNotification = notificationNode.cloneNode(true);
    notificationNode.parentNode.replaceChild(newNotification, notificationNode);

    newNotification.style.display = "block";

    // Add close button click event listener
    let notificationCloseButton = newNotification.querySelector(
      "#npmfNotificationCloseButton"
    );
    if (notificationCloseButton) {
      notificationCloseButton.addEventListener("click", function () {
        this.parentElement.style.display = "none";
      });
    }
  };
}.apply(npmFaves));
