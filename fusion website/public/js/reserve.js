$(document).ready(function () {
    $('#reserveForm').submit(function (event) {
        event.preventDefault();
        $.ajax({
            url: '/reserve',
            type: 'POST',
            data: $('#reserveForm').serialize(),
            success: function (response) {
                alert(response.message);
                $('#reserveForm')[0].reset();
            },
            error: function () {
                alert('Error processing request.');
            }
        });
    });
});
