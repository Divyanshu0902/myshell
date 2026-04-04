#define _CRT_SECURE_NO_WARNINGS

#include <ctype.h>
#include <conio.h>
#include <direct.h>
#include <errno.h>
#include <fcntl.h>
#include <inttypes.h>
#include <io.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <windows.h>

#define MAX_LINE 2048
#define MAX_PATH_ARG 1024
#define HISTORY_SIZE 100
#define MAX_TOKENS 64
#define MAX_MATCHES 256
#define MAX_PIPE_SEGMENTS 8
#define SHELL_VERSION "v6"
#define SHELL_CWD_PREFIX "__MYSHELL_CWD__="

typedef int (*builtin_handler_t)(char *args);

typedef struct {
    char command[MAX_LINE];
    char input_path[MAX_PATH_ARG];
    char output_path[MAX_PATH_ARG];
    bool append_output;
} ParsedCommand;

static char command_history[HISTORY_SIZE][MAX_LINE];
static int history_count = 0;

static void add_history_entry(const char *line) {
    int slot;

    if (line == NULL || *line == '\0') {
        return;
    }

    if (history_count < HISTORY_SIZE) {
        slot = history_count;
        history_count++;
    } else {
        int index;
        for (index = 1; index < HISTORY_SIZE; index++) {
            strcpy(command_history[index - 1], command_history[index]);
        }
        slot = HISTORY_SIZE - 1;
    }

    strncpy(command_history[slot], line, MAX_LINE - 1);
    command_history[slot][MAX_LINE - 1] = '\0';
}

static void print_history(void) {
    int index;

    for (index = 0; index < history_count; index++) {
        printf("%4d  %s\n", index + 1, command_history[index]);
    }
}

static const char *lookup_history_expansion(const char *text) {
    long command_number;
    char *end = NULL;

    if (strcmp(text, "!!") == 0) {
        if (history_count == 0) {
            fprintf(stderr, "history: no previous command\n");
            return NULL;
        }
        return command_history[history_count - 1];
    }

    if (text[0] == '!' && isdigit((unsigned char)text[1])) {
        command_number = strtol(text + 1, &end, 10);
        if (end == NULL || *end != '\0') {
            fprintf(stderr, "history: invalid event designator '%s'\n", text);
            return NULL;
        }

        if (command_number < 1 || command_number > history_count) {
            fprintf(stderr, "history: event not found '%s'\n", text);
            return NULL;
        }

        return command_history[command_number - 1];
    }

    return text;
}

static bool is_variable_char(char ch) {
    return isalnum((unsigned char)ch) || ch == '_';
}

static int expand_environment_variables(
    const char *input,
    char *output,
    size_t output_size
) {
    size_t in_index = 0;
    size_t out_index = 0;
    bool in_single_quotes = false;

    while (input[in_index] != '\0') {
        char ch = input[in_index];

        if (ch == '\'' ) {
            in_single_quotes = !in_single_quotes;
            if (out_index + 1 >= output_size) {
                return 0;
            }
            output[out_index++] = ch;
            in_index++;
            continue;
        }

        if (!in_single_quotes && ch == '%') {
            size_t end_index = in_index + 1;
            char variable_name[MAX_PATH_ARG];
            char *value;

            while (input[end_index] != '\0' && input[end_index] != '%') {
                end_index++;
            }

            if (input[end_index] == '%' && end_index > in_index + 1) {
                size_t name_length = end_index - in_index - 1;
                if (name_length >= sizeof(variable_name)) {
                    return 0;
                }

                memcpy(variable_name, input + in_index + 1, name_length);
                variable_name[name_length] = '\0';
                value = getenv(variable_name);

                if (value != NULL) {
                    size_t value_length = strlen(value);
                    if (out_index + value_length >= output_size) {
                        return 0;
                    }
                    memcpy(output + out_index, value, value_length);
                    out_index += value_length;
                }

                in_index = end_index + 1;
                continue;
            }
        }

        if (!in_single_quotes && ch == '$' && is_variable_char(input[in_index + 1])) {
            size_t end_index = in_index + 1;
            char variable_name[MAX_PATH_ARG];
            char *value;

            while (is_variable_char(input[end_index])) {
                end_index++;
            }

            if (end_index > in_index + 1) {
                size_t name_length = end_index - in_index - 1;
                if (name_length >= sizeof(variable_name)) {
                    return 0;
                }

                memcpy(variable_name, input + in_index + 1, name_length);
                variable_name[name_length] = '\0';
                value = getenv(variable_name);

                if (value != NULL) {
                    size_t value_length = strlen(value);
                    if (out_index + value_length >= output_size) {
                        return 0;
                    }
                    memcpy(output + out_index, value, value_length);
                    out_index += value_length;
                }

                in_index = end_index;
                continue;
            }
        }

        if (out_index + 1 >= output_size) {
            return 0;
        }

        output[out_index++] = ch;
        in_index++;
    }

    output[out_index] = '\0';
    return 1;
}

static bool starts_with_ignore_case(const char *text, const char *prefix) {
    while (*prefix != '\0') {
        if (tolower((unsigned char)*text) != tolower((unsigned char)*prefix)) {
            return false;
        }
        text++;
        prefix++;
    }

    return true;
}

static int print_windows_error(const char *action, const char *target) {
    DWORD error = GetLastError();
    LPSTR message = NULL;

    FormatMessageA(
        FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM |
            FORMAT_MESSAGE_IGNORE_INSERTS,
        NULL,
        error,
        MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
        (LPSTR)&message,
        0,
        NULL
    );

    if (message != NULL) {
        fprintf(stderr, "%s '%s': %s", action, target, message);
        LocalFree(message);
    } else {
        fprintf(stderr, "%s '%s' failed with Windows error %lu\n", action, target, error);
    }

    return 1;
}

static char *trim_whitespace(char *text) {
    char *start = text;
    char *end;

    while (*start != '\0' && isspace((unsigned char)*start)) {
        start++;
    }

    if (*start == '\0') {
        return start;
    }

    end = start + strlen(start) - 1;
    while (end > start && isspace((unsigned char)*end)) {
        *end = '\0';
        end--;
    }

    return start;
}

static void strip_matching_quotes(char *text) {
    size_t length = strlen(text);

    if (length >= 2) {
        if ((text[0] == '"' && text[length - 1] == '"') ||
            (text[0] == '\'' && text[length - 1] == '\'')) {
            memmove(text, text + 1, length - 2);
            text[length - 2] = '\0';
        }
    }
}

static void emit_current_directory_control_line(void) {
    char cwd[MAX_PATH];

    if (_getcwd(cwd, sizeof(cwd)) != NULL) {
        printf(SHELL_CWD_PREFIX "%s\n", cwd);
        fflush(stdout);
    }
}

#define PROMPT_COLOR "\x1b[38;2;119;178;255m"
#define COLOR_RESET "\x1b[0m"

static void format_prompt(char *buffer, size_t size) {
    _snprintf(
        buffer,
        size,
        PROMPT_COLOR "bolBhai" COLOR_RESET ">> "
    );
    buffer[size - 1] = '\0';
}

static void redraw_input_line(
    const char *prompt,
    const char *buffer,
    size_t length,
    size_t cursor
) {
    size_t index;

    printf("\r%s%s ", prompt, buffer);
    for (index = length; index > cursor; index--) {
        putchar('\b');
    }
    fflush(stdout);
}

static void replace_input_buffer(
    char *buffer,
    size_t *length,
    size_t *cursor,
    const char *text,
    const char *prompt
) {
    strncpy(buffer, text, MAX_LINE - 1);
    buffer[MAX_LINE - 1] = '\0';
    *length = strlen(buffer);
    *cursor = *length;
    redraw_input_line(prompt, buffer, *length, *cursor);
}

static void find_token_bounds(
    const char *buffer,
    size_t cursor,
    size_t *token_start,
    size_t *token_end,
    bool *quoted,
    char *quote_char
) {
    size_t index;
    bool in_single_quotes = false;
    bool in_double_quotes = false;
    size_t current_start = 0;

    *quoted = false;
    *quote_char = '\0';

    for (index = 0; index < cursor; index++) {
        if (buffer[index] == '"' && !in_single_quotes) {
            in_double_quotes = !in_double_quotes;
            if (index == current_start) {
                *quoted = true;
                *quote_char = '"';
                current_start = index + 1;
            }
            continue;
        }

        if (buffer[index] == '\'' && !in_double_quotes) {
            in_single_quotes = !in_single_quotes;
            if (index == current_start) {
                *quoted = true;
                *quote_char = '\'';
                current_start = index + 1;
            }
            continue;
        }

        if (!in_single_quotes && !in_double_quotes &&
            isspace((unsigned char)buffer[index])) {
            current_start = index + 1;
            *quoted = false;
            *quote_char = '\0';
        }
    }

    *token_start = current_start;
    *token_end = cursor;

    while (buffer[*token_end] != '\0') {
        if (!in_single_quotes && !in_double_quotes &&
            isspace((unsigned char)buffer[*token_end])) {
            break;
        }

        if (buffer[*token_end] == '"' && !in_single_quotes) {
            in_double_quotes = !in_double_quotes;
            break;
        }

        if (buffer[*token_end] == '\'' && !in_double_quotes) {
            in_single_quotes = !in_single_quotes;
            break;
        }

        (*token_end)++;
    }
}

static void longest_common_prefix(
    char matches[][MAX_PATH_ARG],
    int match_count,
    char *output,
    size_t output_size
) {
    size_t prefix_length;
    int index;

    if (match_count <= 0) {
        output[0] = '\0';
        return;
    }

    strncpy(output, matches[0], output_size - 1);
    output[output_size - 1] = '\0';
    prefix_length = strlen(output);

    for (index = 1; index < match_count; index++) {
        size_t shared = 0;
        while (shared < prefix_length &&
               output[shared] != '\0' &&
               matches[index][shared] != '\0' &&
               tolower((unsigned char)output[shared]) ==
                   tolower((unsigned char)matches[index][shared])) {
            shared++;
        }
        output[shared] = '\0';
        prefix_length = shared;
    }
}

static int replace_range_in_buffer(
    char *buffer,
    size_t size,
    size_t *length,
    size_t *cursor,
    size_t start,
    size_t end,
    const char *replacement
) {
    size_t replacement_length = strlen(replacement);
    size_t tail_length = *length - end;

    if (start > end || end > *length) {
        return 0;
    }

    if (start + replacement_length + tail_length + 1 > size) {
        return 0;
    }

    memmove(
        buffer + start + replacement_length,
        buffer + end,
        tail_length + 1
    );
    memcpy(buffer + start, replacement, replacement_length);
    *length = start + replacement_length + tail_length;
    *cursor = start + replacement_length;
    return 1;
}

static void print_completion_matches(
    char matches[][MAX_PATH_ARG],
    int match_count,
    bool is_dir[],
    const char *prompt,
    const char *buffer,
    size_t length,
    size_t cursor
) {
    int index;

    putchar('\n');
    for (index = 0; index < match_count; index++) {
        printf("%s%s\n", matches[index], is_dir[index] ? "/" : "");
    }
    redraw_input_line(prompt, buffer, length, cursor);
}

static void handle_tab_completion(
    char *buffer,
    size_t size,
    size_t *length,
    size_t *cursor,
    const char *prompt
) {
    size_t token_start;
    size_t token_end;
    size_t last_separator;
    size_t index;
    size_t replace_start;
    bool quoted;
    char quote_char;
    char token[MAX_PATH_ARG];
    char directory_part[MAX_PATH_ARG];
    char prefix[MAX_PATH_ARG];
    char search_path[MAX_PATH_ARG + 4];
    char matches[MAX_MATCHES][MAX_PATH_ARG];
    bool match_is_dir[MAX_MATCHES];
    char common_prefix[MAX_PATH_ARG];
    int match_count = 0;
    WIN32_FIND_DATAA entry;
    HANDLE handle;

    find_token_bounds(buffer, *cursor, &token_start, &token_end, &quoted, &quote_char);
    replace_start = token_start;
    if (quoted && token_start > 0 &&
        (buffer[token_start - 1] == '"' || buffer[token_start - 1] == '\'')) {
        replace_start = token_start - 1;
    }

    if (token_end - token_start >= sizeof(token)) {
        return;
    }

    memcpy(token, buffer + token_start, token_end - token_start);
    token[token_end - token_start] = '\0';

    last_separator = SIZE_MAX;
    for (index = 0; token[index] != '\0'; index++) {
        if (token[index] == '\\' || token[index] == '/') {
            last_separator = index;
        }
    }

    if (last_separator == SIZE_MAX) {
        strcpy(directory_part, "");
        strncpy(prefix, token, sizeof(prefix) - 1);
        prefix[sizeof(prefix) - 1] = '\0';
        strcpy(search_path, "*");
    } else {
        size_t dir_length = last_separator + 1;
        memcpy(directory_part, token, dir_length);
        directory_part[dir_length] = '\0';
        strncpy(prefix, token + dir_length, sizeof(prefix) - 1);
        prefix[sizeof(prefix) - 1] = '\0';
        _snprintf(search_path, sizeof(search_path), "%s*", directory_part);
        search_path[sizeof(search_path) - 1] = '\0';
    }

    handle = FindFirstFileA(search_path, &entry);
    if (handle == INVALID_HANDLE_VALUE) {
        putchar('\a');
        fflush(stdout);
        return;
    }

    do {
        bool is_dot = strcmp(entry.cFileName, ".") == 0 || strcmp(entry.cFileName, "..") == 0;
        if (is_dot) {
            continue;
        }

        if (!starts_with_ignore_case(entry.cFileName, prefix)) {
            continue;
        }

        if (match_count >= MAX_MATCHES) {
            break;
        }

        _snprintf(
            matches[match_count],
            sizeof(matches[match_count]),
            "%s%s",
            directory_part,
            entry.cFileName
        );
        matches[match_count][sizeof(matches[match_count]) - 1] = '\0';
        match_is_dir[match_count] =
            (entry.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != 0;
        match_count++;
    } while (FindNextFileA(handle, &entry));

    FindClose(handle);

    if (match_count == 0) {
        putchar('\a');
        fflush(stdout);
        return;
    }

    if (match_count == 1) {
        char replacement[MAX_PATH_ARG + 4];
        const char *selected = matches[0];

        if (quoted) {
            _snprintf(replacement, sizeof(replacement), "%c%s", quote_char, selected);
            if (!match_is_dir[0]) {
                _snprintf(
                    replacement,
                    sizeof(replacement),
                    "%c%s%c",
                    quote_char,
                    selected,
                    quote_char
                );
            }
        } else if (strchr(selected, ' ') != NULL) {
            _snprintf(replacement, sizeof(replacement), "\"%s\"", selected);
        } else {
            _snprintf(replacement, sizeof(replacement), "%s", selected);
        }

        replacement[sizeof(replacement) - 1] = '\0';

        if (!quoted && strchr(selected, ' ') != NULL && match_is_dir[0]) {
            replacement[strlen(replacement) - 1] = '\0';
        } else if (match_is_dir[0]) {
            size_t replacement_length = strlen(replacement);
            if (replacement_length + 1 < sizeof(replacement)) {
                replacement[replacement_length] = '\\';
                replacement[replacement_length + 1] = '\0';
            }
        }

        if (replace_range_in_buffer(
                buffer,
                size,
                length,
                cursor,
                replace_start,
                token_end,
                replacement)) {
            redraw_input_line(prompt, buffer, *length, *cursor);
        }
        return;
    }

    longest_common_prefix(matches, match_count, common_prefix, sizeof(common_prefix));
    if (strlen(common_prefix) > strlen(token)) {
        char replacement[MAX_PATH_ARG + 4];

        if (quoted) {
            _snprintf(replacement, sizeof(replacement), "%c%s", quote_char, common_prefix);
        } else if (strchr(common_prefix, ' ') != NULL) {
            _snprintf(replacement, sizeof(replacement), "\"%s", common_prefix);
        } else {
            _snprintf(replacement, sizeof(replacement), "%s", common_prefix);
        }
        replacement[sizeof(replacement) - 1] = '\0';

        if (replace_range_in_buffer(
                buffer,
                size,
                length,
                cursor,
                replace_start,
                token_end,
                replacement)) {
            redraw_input_line(prompt, buffer, *length, *cursor);
        }
        return;
    }

    print_completion_matches(
        matches,
        match_count,
        match_is_dir,
        prompt,
        buffer,
        *length,
        *cursor
    );
}

static int read_input_line(char *buffer, size_t size) {
    char prompt[MAX_PATH + 16];
    size_t length = 0;
    size_t cursor = 0;
    int history_index = history_count;

    if (!_isatty(_fileno(stdin))) {
        return fgets(buffer, (int)size, stdin) != NULL;
    }

    format_prompt(prompt, sizeof(prompt));
    fputs(prompt, stdout);
    fflush(stdout);
    buffer[0] = '\0';

    while (true) {
        int ch = _getch();

        if (ch == '\r') {
            buffer[length] = '\0';
            putchar('\n');
            return 1;
        }

        if (ch == '\t') {
            handle_tab_completion(buffer, size, &length, &cursor, prompt);
            continue;
        }

        if (ch == '\b') {
            if (cursor > 0) {
                memmove(buffer + cursor - 1, buffer + cursor, length - cursor + 1);
                cursor--;
                length--;
                redraw_input_line(prompt, buffer, length, cursor);
            }
            continue;
        }

        if (ch == 0 || ch == 224) {
            int extended = _getch();

            if (extended == 75) {
                if (cursor > 0) {
                    cursor--;
                    redraw_input_line(prompt, buffer, length, cursor);
                }
            } else if (extended == 77) {
                if (cursor < length) {
                    cursor++;
                    redraw_input_line(prompt, buffer, length, cursor);
                }
            } else if (extended == 72) {
                if (history_count > 0 && history_index > 0) {
                    history_index--;
                    replace_input_buffer(
                        buffer,
                        &length,
                        &cursor,
                        command_history[history_index],
                        prompt
                    );
                }
            } else if (extended == 80) {
                if (history_index < history_count - 1) {
                    history_index++;
                    replace_input_buffer(
                        buffer,
                        &length,
                        &cursor,
                        command_history[history_index],
                        prompt
                    );
                } else if (history_index == history_count - 1) {
                    history_index = history_count;
                    replace_input_buffer(buffer, &length, &cursor, "", prompt);
                }
            } else if (extended == 71) {
                cursor = 0;
                redraw_input_line(prompt, buffer, length, cursor);
            } else if (extended == 79) {
                cursor = length;
                redraw_input_line(prompt, buffer, length, cursor);
            } else if (extended == 83) {
                if (cursor < length) {
                    memmove(buffer + cursor, buffer + cursor + 1, length - cursor);
                    length--;
                    redraw_input_line(prompt, buffer, length, cursor);
                }
            }
            continue;
        }

        if (isprint(ch) && length + 1 < size) {
            memmove(buffer + cursor + 1, buffer + cursor, length - cursor + 1);
            buffer[cursor] = (char)ch;
            cursor++;
            length++;
            history_index = history_count;
            redraw_input_line(prompt, buffer, length, cursor);
        }
    }
}

static int split_arguments(char *input, char *tokens[], int max_tokens) {
    int count = 0;
    char *cursor = input;

    while (*cursor != '\0') {
        char *start;
        char *write;
        char quote = '\0';

        while (isspace((unsigned char)*cursor)) {
            cursor++;
        }

        if (*cursor == '\0') {
            break;
        }

        if (count >= max_tokens) {
            fprintf(stderr, "too many arguments\n");
            return -1;
        }

        start = cursor;
        write = cursor;

        while (*cursor != '\0') {
            if (quote == '\0' && (*cursor == '"' || *cursor == '\'')) {
                quote = *cursor;
                cursor++;
                continue;
            }

            if (quote != '\0' && *cursor == quote) {
                quote = '\0';
                cursor++;
                continue;
            }

            if (quote == '\0' && isspace((unsigned char)*cursor)) {
                break;
            }

            *write = *cursor;
            write++;
            cursor++;
        }

        if (quote != '\0') {
            fprintf(stderr, "unterminated quoted string\n");
            return -1;
        }

        *write = '\0';
        tokens[count++] = start;

        while (isspace((unsigned char)*cursor)) {
            *cursor = '\0';
            cursor++;
        }
    }

    return count;
}

static int split_pipeline_segments(
    char *input,
    char *segments[],
    int max_segments
) {
    int count = 0;
    char *segment_start = input;
    bool in_single_quotes = false;
    bool in_double_quotes = false;

    while (*input != '\0') {
        if (*input == '"' && !in_single_quotes) {
            in_double_quotes = !in_double_quotes;
        } else if (*input == '\'' && !in_double_quotes) {
            in_single_quotes = !in_single_quotes;
        } else if (*input == '|' && !in_single_quotes && !in_double_quotes) {
            if (count >= max_segments) {
                fprintf(stderr, "pipeline: too many segments\n");
                return -1;
            }

            *input = '\0';
            segments[count++] = trim_whitespace(segment_start);
            segment_start = input + 1;
        }
        input++;
    }

    if (count >= max_segments) {
        fprintf(stderr, "pipeline: too many segments\n");
        return -1;
    }

    segments[count++] = trim_whitespace(segment_start);
    return count;
}

static int read_redirection_target(
    const char *cursor,
    char *target,
    size_t target_size,
    size_t *consumed
) {
    size_t index = 0;
    size_t out_index = 0;
    char quote = '\0';

    while (isspace((unsigned char)cursor[index])) {
        index++;
    }

    if (cursor[index] == '\0') {
        fprintf(stderr, "redirection: missing file operand\n");
        return 0;
    }

    while (cursor[index] != '\0') {
        if (quote == '\0' &&
            (cursor[index] == '"' || cursor[index] == '\'')) {
            quote = cursor[index];
            index++;
            continue;
        }

        if (quote != '\0' && cursor[index] == quote) {
            quote = '\0';
            index++;
            continue;
        }

        if (quote == '\0' &&
            (isspace((unsigned char)cursor[index]) ||
             cursor[index] == '<' || cursor[index] == '>' ||
             cursor[index] == '|')) {
            break;
        }

        if (out_index + 1 >= target_size) {
            return 0;
        }

        target[out_index++] = cursor[index++];
    }

    if (quote != '\0') {
        fprintf(stderr, "redirection: unterminated quoted string\n");
        return 0;
    }

    target[out_index] = '\0';
    *consumed = index;
    return out_index > 0;
}

static int parse_command_segment(char *segment, ParsedCommand *parsed) {
    size_t read_index = 0;
    size_t write_index = 0;
    bool in_single_quotes = false;
    bool in_double_quotes = false;

    memset(parsed, 0, sizeof(*parsed));

    while (segment[read_index] != '\0') {
        if (segment[read_index] == '"' && !in_single_quotes) {
            in_double_quotes = !in_double_quotes;
            parsed->command[write_index++] = segment[read_index++];
            continue;
        }

        if (segment[read_index] == '\'' && !in_double_quotes) {
            in_single_quotes = !in_single_quotes;
            parsed->command[write_index++] = segment[read_index++];
            continue;
        }

        if (!in_single_quotes && !in_double_quotes &&
            (segment[read_index] == '<' || segment[read_index] == '>')) {
            bool is_output = segment[read_index] == '>';
            bool append = false;
            char target[MAX_PATH_ARG];
            size_t consumed = 0;

            if (is_output && segment[read_index + 1] == '>') {
                append = true;
                read_index++;
            }
            read_index++;

            if (!read_redirection_target(
                    segment + read_index,
                    target,
                    sizeof(target),
                    &consumed)) {
                return 0;
            }

            if (is_output) {
                strncpy(parsed->output_path, target, sizeof(parsed->output_path) - 1);
                parsed->output_path[sizeof(parsed->output_path) - 1] = '\0';
                parsed->append_output = append;
            } else {
                strncpy(parsed->input_path, target, sizeof(parsed->input_path) - 1);
                parsed->input_path[sizeof(parsed->input_path) - 1] = '\0';
            }

            read_index += consumed;
            while (isspace((unsigned char)segment[read_index])) {
                read_index++;
            }
            continue;
        }

        parsed->command[write_index++] = segment[read_index++];
        if (write_index + 1 >= sizeof(parsed->command)) {
            return 0;
        }
    }

    parsed->command[write_index] = '\0';
    memmove(parsed->command, trim_whitespace(parsed->command), strlen(trim_whitespace(parsed->command)) + 1);

    if (parsed->command[0] == '\0') {
        fprintf(stderr, "empty command segment\n");
        return 0;
    }

    return 1;
}

static HANDLE open_input_file_handle(const char *path) {
    return CreateFileA(
        path,
        GENERIC_READ,
        FILE_SHARE_READ | FILE_SHARE_WRITE,
        NULL,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL,
        NULL
    );
}

static HANDLE open_output_file_handle(const char *path, bool append) {
    HANDLE handle = CreateFileA(
        path,
        FILE_APPEND_DATA | GENERIC_WRITE,
        FILE_SHARE_READ,
        NULL,
        append ? OPEN_ALWAYS : CREATE_ALWAYS,
        FILE_ATTRIBUTE_NORMAL,
        NULL
    );

    if (handle != INVALID_HANDLE_VALUE && append) {
        SetFilePointer(handle, 0, NULL, FILE_END);
    }

    return handle;
}

static HANDLE open_temp_pipe_file(void) {
    char temp_path[MAX_PATH];
    char temp_file[MAX_PATH];

    if (GetTempPathA(sizeof(temp_path), temp_path) == 0) {
        return INVALID_HANDLE_VALUE;
    }

    if (GetTempFileNameA(temp_path, "msh", 0, temp_file) == 0) {
        return INVALID_HANDLE_VALUE;
    }

    return CreateFileA(
        temp_file,
        GENERIC_READ | GENERIC_WRITE | DELETE,
        FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
        NULL,
        CREATE_ALWAYS,
        FILE_ATTRIBUTE_TEMPORARY | FILE_FLAG_DELETE_ON_CLOSE,
        NULL
    );
}

static void print_help(void) {
    puts("Mini Shell commands:");
    puts("  help                 Show this help message");
    puts("  exit, quit           Close the shell");
    puts("  cd <path>            Change directory");
    puts("  pwd                  Print current directory");
    puts("  history              Show recent commands");
    puts("  !! and !n            Re-run history entries");
    puts("  ls [path]            List files");
    puts("  cat <file...>        Print file contents");
    puts("  mkdir <dir>          Create a directory");
    puts("  rmdir <dir>          Remove an empty directory");
    puts("  rm <file>            Remove a file");
    puts("  cp <src> <dest>      Copy a file");
    puts("  mv <src> <dest>      Move or rename a file");
    puts("  touch <file>         Create an empty file if missing");
    puts("  clear                Clear the screen");
    puts("  Arrow keys           Edit input and browse history");
    puts("  Tab                  Complete files and directories");
    puts("  Pipes and redirection use cmd.exe /C");
    puts("  Other commands run through cmd.exe /C");
}

static int builtin_cd(char *args) {
    char path[MAX_LINE];
    char *target = NULL;

    if (args != NULL) {
        args = trim_whitespace(args);
        if (*args != '\0') {
            strncpy(path, args, sizeof(path) - 1);
            path[sizeof(path) - 1] = '\0';
            strip_matching_quotes(path);
            target = path;
        }
    }

    if (target == NULL) {
        char *home = getenv("USERPROFILE");
        if (home == NULL || *home == '\0') {
            fprintf(stderr, "cd: USERPROFILE is not set.\n");
            return 1;
        }
        target = home;
    }

    if (_chdir(target) != 0) {
        fprintf(stderr, "cd: unable to change directory to '%s'\n", target);
        return 1;
    }

    return 0;
}

static int builtin_pwd(void) {
    char cwd[MAX_PATH];

    if (_getcwd(cwd, sizeof(cwd)) == NULL) {
        fputs("pwd: unable to read current directory\n", stderr);
        return 1;
    }

    puts(cwd);
    return 0;
}

static int read_single_path(char *args, char *output, size_t output_size) {
    char buffer[MAX_LINE];
    char *tokens[2];
    int token_count;

    if (args == NULL) {
        fprintf(stderr, "missing path argument\n");
        return 1;
    }

    strncpy(buffer, args, sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';
    token_count = split_arguments(buffer, tokens, 2);
    if (token_count < 0) {
        return 1;
    }

    if (token_count == 0) {
        fprintf(stderr, "missing path argument\n");
        return 1;
    }

    strncpy(output, tokens[0], output_size - 1);
    output[output_size - 1] = '\0';
    return 0;
}

static int read_two_paths(
    char *args,
    char *first,
    size_t first_size,
    char *second,
    size_t second_size
) {
    char buffer[MAX_LINE];
    char *tokens[3];
    int token_count;

    if (args == NULL) {
        fprintf(stderr, "expected source and destination paths\n");
        return 1;
    }

    strncpy(buffer, args, sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';
    token_count = split_arguments(buffer, tokens, 3);

    if (token_count < 0) {
        return 1;
    }

    if (token_count != 2) {
        fprintf(stderr, "expected source and destination paths\n");
        return 1;
    }

    strncpy(first, tokens[0], first_size - 1);
    first[first_size - 1] = '\0';

    strncpy(second, tokens[1], second_size - 1);
    second[second_size - 1] = '\0';

    return 0;
}

static int builtin_ls(char *args) {
    WIN32_FIND_DATAA entry;
    HANDLE handle;
    char path[MAX_PATH_ARG];
    char pattern[MAX_PATH_ARG + 5];
    bool show_all = false;
    bool long_format = false;

    if (args == NULL || *trim_whitespace(args) == '\0') {
        strcpy(path, ".");
    } else {
        char buffer[MAX_LINE];
        char *tokens[MAX_TOKENS];
        int token_count;
        int index;

        strncpy(buffer, args, sizeof(buffer) - 1);
        buffer[sizeof(buffer) - 1] = '\0';
        token_count = split_arguments(buffer, tokens, MAX_TOKENS);
        if (token_count < 0) {
            return 1;
        }

        strcpy(path, ".");
        for (index = 0; index < token_count; index++) {
            if (tokens[index][0] == '-' && tokens[index][1] != '\0' &&
                strcmp(tokens[index], "--") != 0) {
                int flag_index;
                for (flag_index = 1; tokens[index][flag_index] != '\0'; flag_index++) {
                    if (tokens[index][flag_index] == 'a') {
                        show_all = true;
                    } else if (tokens[index][flag_index] == 'l') {
                        long_format = true;
                    } else {
                        fprintf(stderr, "ls: unsupported option '-%c'\n", tokens[index][flag_index]);
                        return 1;
                    }
                }
            } else if (strcmp(tokens[index], "--") == 0) {
                index++;
                break;
            } else {
                break;
            }
        }

        if (index < token_count) {
            if (index + 1 != token_count) {
                fprintf(stderr, "ls: too many path operands\n");
                return 1;
            }

            strncpy(path, tokens[index], sizeof(path) - 1);
            path[sizeof(path) - 1] = '\0';
        }
    }

    _snprintf(pattern, sizeof(pattern), "%s\\*", path);
    handle = FindFirstFileA(pattern, &entry);
    if (handle == INVALID_HANDLE_VALUE) {
        return print_windows_error("ls", path);
    }

    do {
        bool hidden = (entry.dwFileAttributes & FILE_ATTRIBUTE_HIDDEN) != 0;
        bool is_dot = strcmp(entry.cFileName, ".") == 0 || strcmp(entry.cFileName, "..") == 0;
        bool is_dir = (entry.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != 0;

        if ((hidden || is_dot) && !show_all) {
            continue;
        }

        if (long_format) {
            LARGE_INTEGER size;
            size.HighPart = entry.nFileSizeHigh;
            size.LowPart = entry.nFileSizeLow;
            printf(
                "%c %10" PRIu64 " %s\n",
                is_dir ? 'd' : '-',
                (uint64_t)size.QuadPart,
                entry.cFileName
            );
        } else {
            printf("%s%s\n", entry.cFileName, is_dir ? "/" : "");
        }
    } while (FindNextFileA(handle, &entry));

    FindClose(handle);
    return 0;
}

static int builtin_cat(char *args) {
    char buffer[MAX_LINE];
    char *tokens[MAX_TOKENS];
    FILE *file;
    int ch;
    int index;
    int token_count;
    bool printed_any = false;

    if (args == NULL || *trim_whitespace(args) == '\0') {
        fprintf(stderr, "cat: missing file operand\n");
        return 1;
    }

    strncpy(buffer, args, sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';
    token_count = split_arguments(buffer, tokens, MAX_TOKENS);
    if (token_count < 0) {
        return 1;
    }

    for (index = 0; index < token_count; index++) {
        file = fopen(tokens[index], "r");
        if (file == NULL) {
            fprintf(stderr, "cat: cannot open '%s'\n", tokens[index]);
            return 1;
        }

        while ((ch = fgetc(file)) != EOF) {
            putchar(ch);
        }

        fclose(file);
        printed_any = true;
    }

    if (printed_any) {
        fflush(stdout);
    }

    return 0;
}

static int builtin_mkdir(char *args) {
    char path[MAX_PATH_ARG];

    if (read_single_path(args, path, sizeof(path)) != 0) {
        fprintf(stderr, "mkdir: missing directory operand\n");
        return 1;
    }

    if (_mkdir(path) != 0) {
        fprintf(stderr, "mkdir: cannot create '%s' (%s)\n", path, strerror(errno));
        return 1;
    }

    return 0;
}

static int builtin_rmdir(char *args) {
    char path[MAX_PATH_ARG];

    if (read_single_path(args, path, sizeof(path)) != 0) {
        fprintf(stderr, "rmdir: missing directory operand\n");
        return 1;
    }

    if (_rmdir(path) != 0) {
        fprintf(stderr, "rmdir: cannot remove '%s' (%s)\n", path, strerror(errno));
        return 1;
    }

    return 0;
}

static int builtin_rm(char *args) {
    char path[MAX_PATH_ARG];

    if (read_single_path(args, path, sizeof(path)) != 0) {
        fprintf(stderr, "rm: missing file operand\n");
        return 1;
    }

    if (!DeleteFileA(path)) {
        return print_windows_error("rm", path);
    }

    return 0;
}

static int builtin_touch(char *args) {
    char path[MAX_PATH_ARG];
    FILE *file;

    if (read_single_path(args, path, sizeof(path)) != 0) {
        fprintf(stderr, "touch: missing file operand\n");
        return 1;
    }

    file = fopen(path, "ab");
    if (file == NULL) {
        fprintf(stderr, "touch: cannot open '%s'\n", path);
        return 1;
    }

    fclose(file);
    return 0;
}

static int builtin_cp(char *args) {
    char source[MAX_PATH_ARG];
    char destination[MAX_PATH_ARG];

    if (read_two_paths(args, source, sizeof(source), destination, sizeof(destination)) != 0) {
        fprintf(stderr, "cp: expected source and destination\n");
        return 1;
    }

    if (!CopyFileA(source, destination, FALSE)) {
        return print_windows_error("cp", source);
    }

    return 0;
}

static int builtin_mv(char *args) {
    char source[MAX_PATH_ARG];
    char destination[MAX_PATH_ARG];

    if (read_two_paths(args, source, sizeof(source), destination, sizeof(destination)) != 0) {
        fprintf(stderr, "mv: expected source and destination\n");
        return 1;
    }

    if (!MoveFileExA(source, destination, MOVEFILE_REPLACE_EXISTING)) {
        return print_windows_error("mv", source);
    }

    return 0;
}

static int builtin_clear(void) {
    HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);
    CONSOLE_SCREEN_BUFFER_INFO info;
    COORD origin = {0, 0};
    DWORD written;
    DWORD size;

    if (console == INVALID_HANDLE_VALUE || !GetConsoleScreenBufferInfo(console, &info)) {
        fputs("\x1b[2J\x1b[H", stdout);
        fflush(stdout);
        return 0;
    }

    size = (DWORD)(info.dwSize.X * info.dwSize.Y);
    FillConsoleOutputCharacterA(console, ' ', size, origin, &written);
    FillConsoleOutputAttribute(console, info.wAttributes, size, origin, &written);
    SetConsoleCursorPosition(console, origin);
    return 0;
}

static int builtin_clear_command(char *args) {
    (void)args;
    return builtin_clear();
}

static int builtin_pwd_command(char *args) {
    (void)args;
    return builtin_pwd();
}

static int builtin_history_command(char *args) {
    (void)args;
    print_history();
    return 0;
}

static builtin_handler_t lookup_builtin(const char *command) {
    if (_stricmp(command, "cd") == 0) {
        return builtin_cd;
    }

    if (_stricmp(command, "pwd") == 0) {
        return builtin_pwd_command;
    }

    if (_stricmp(command, "history") == 0) {
        return builtin_history_command;
    }

    if (_stricmp(command, "ls") == 0) {
        return builtin_ls;
    }

    if (_stricmp(command, "cat") == 0) {
        return builtin_cat;
    }

    if (_stricmp(command, "mkdir") == 0) {
        return builtin_mkdir;
    }

    if (_stricmp(command, "rmdir") == 0) {
        return builtin_rmdir;
    }

    if (_stricmp(command, "rm") == 0) {
        return builtin_rm;
    }

    if (_stricmp(command, "touch") == 0) {
        return builtin_touch;
    }

    if (_stricmp(command, "cp") == 0) {
        return builtin_cp;
    }

    if (_stricmp(command, "mv") == 0) {
        return builtin_mv;
    }

    if (_stricmp(command, "clear") == 0) {
        return builtin_clear_command;
    }

    return NULL;
}

static int run_builtin_command(
    builtin_handler_t handler,
    char *args,
    HANDLE stdin_handle,
    HANDLE stdout_handle
) {
    int saved_stdin = -1;
    int saved_stdout = -1;
    int stdin_fd = -1;
    int stdout_fd = -1;
    HANDLE duplicated_handle;
    int result;

    fflush(stdout);
    fflush(stderr);

    if (stdin_handle != NULL) {
        saved_stdin = _dup(_fileno(stdin));
        if (saved_stdin >= 0 &&
            DuplicateHandle(
                GetCurrentProcess(),
                stdin_handle,
                GetCurrentProcess(),
                &duplicated_handle,
                0,
                TRUE,
                DUPLICATE_SAME_ACCESS)) {
            stdin_fd = _open_osfhandle((intptr_t)duplicated_handle, _O_RDONLY);
            if (stdin_fd >= 0) {
                _dup2(stdin_fd, _fileno(stdin));
            }
        }
    }

    if (stdout_handle != NULL) {
        saved_stdout = _dup(_fileno(stdout));
        if (saved_stdout >= 0 &&
            DuplicateHandle(
                GetCurrentProcess(),
                stdout_handle,
                GetCurrentProcess(),
                &duplicated_handle,
                0,
                TRUE,
                DUPLICATE_SAME_ACCESS)) {
            stdout_fd = _open_osfhandle((intptr_t)duplicated_handle, _O_TEXT);
            if (stdout_fd >= 0) {
                _dup2(stdout_fd, _fileno(stdout));
            }
        }
    }

    result = handler(args);

    fflush(stdout);
    fflush(stderr);

    if (saved_stdout >= 0) {
        _dup2(saved_stdout, _fileno(stdout));
        _close(saved_stdout);
    }
    if (stdout_fd >= 0) {
        _close(stdout_fd);
    }

    if (saved_stdin >= 0) {
        _dup2(saved_stdin, _fileno(stdin));
        _close(saved_stdin);
    }
    if (stdin_fd >= 0) {
        _close(stdin_fd);
    }

    return result;
}

static int run_external_command(
    const char *command_line,
    HANDLE stdin_handle,
    HANDLE stdout_handle
) {
    STARTUPINFOA startup_info;
    PROCESS_INFORMATION process_info;
    char full_command[MAX_LINE + 32];
    DWORD exit_code = 1;
    BOOL created;
    HANDLE inherited_input = NULL;
    HANDLE inherited_output = NULL;
    HANDLE inherited_error = NULL;
    HANDLE source_input = stdin_handle != NULL ? stdin_handle : GetStdHandle(STD_INPUT_HANDLE);
    HANDLE source_output = stdout_handle != NULL ? stdout_handle : GetStdHandle(STD_OUTPUT_HANDLE);
    HANDLE source_error = GetStdHandle(STD_ERROR_HANDLE);

    memset(&startup_info, 0, sizeof(startup_info));
    memset(&process_info, 0, sizeof(process_info));
    startup_info.cb = sizeof(startup_info);
    startup_info.dwFlags = STARTF_USESTDHANDLES;

    if (!DuplicateHandle(
            GetCurrentProcess(),
            source_input,
            GetCurrentProcess(),
            &inherited_input,
            0,
            TRUE,
            DUPLICATE_SAME_ACCESS) ||
        !DuplicateHandle(
            GetCurrentProcess(),
            source_output,
            GetCurrentProcess(),
            &inherited_output,
            0,
            TRUE,
            DUPLICATE_SAME_ACCESS) ||
        !DuplicateHandle(
            GetCurrentProcess(),
            source_error,
            GetCurrentProcess(),
            &inherited_error,
            0,
            TRUE,
            DUPLICATE_SAME_ACCESS)) {
        if (inherited_input != NULL) {
            CloseHandle(inherited_input);
        }
        if (inherited_output != NULL) {
            CloseHandle(inherited_output);
        }
        if (inherited_error != NULL) {
            CloseHandle(inherited_error);
        }
        return print_windows_error("run", command_line);
    }

    startup_info.hStdInput = inherited_input;
    startup_info.hStdOutput = inherited_output;
    startup_info.hStdError = inherited_error;

    _snprintf(
        full_command,
        sizeof(full_command),
        "cmd.exe /C %s",
        command_line
    );

    fflush(stdout);
    fflush(stderr);

    created = CreateProcessA(
        NULL,
        full_command,
        NULL,
        NULL,
        TRUE,
        0,
        NULL,
        NULL,
        &startup_info,
        &process_info
    );

    if (!created) {
        CloseHandle(inherited_input);
        CloseHandle(inherited_output);
        CloseHandle(inherited_error);
        return print_windows_error("run", command_line);
    }

    WaitForSingleObject(process_info.hProcess, INFINITE);
    GetExitCodeProcess(process_info.hProcess, &exit_code);

    CloseHandle(inherited_input);
    CloseHandle(inherited_output);
    CloseHandle(inherited_error);
    CloseHandle(process_info.hThread);
    CloseHandle(process_info.hProcess);

    return (int)exit_code;
}

static int execute_single_command(
    const char *command_line,
    HANDLE stdin_handle,
    HANDLE stdout_handle
) {
    char buffer[MAX_LINE];
    char *command;
    char *args;
    builtin_handler_t builtin;

    strncpy(buffer, command_line, sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';

    command = trim_whitespace(buffer);
    if (*command == '\0') {
        return 0;
    }

    args = command;
    while (*args != '\0' && !isspace((unsigned char)*args)) {
        args++;
    }

    if (*args != '\0') {
        *args = '\0';
        args++;
        args = trim_whitespace(args);
    } else {
        args = NULL;
    }

    builtin = lookup_builtin(command);
    if (builtin != NULL) {
        return run_builtin_command(builtin, args, stdin_handle, stdout_handle);
    }

    return run_external_command(command_line, stdin_handle, stdout_handle);
}

static int execute_pipeline(char *line) {
    char *segments[MAX_PIPE_SEGMENTS];
    int segment_count;
    int index;
    HANDLE previous_output = NULL;

    segment_count = split_pipeline_segments(line, segments, MAX_PIPE_SEGMENTS);
    if (segment_count <= 0) {
        return 1;
    }

    for (index = 0; index < segment_count; index++) {
        ParsedCommand parsed;
        HANDLE input_handle = NULL;
        HANDLE output_handle = NULL;
        HANDLE temp_output = NULL;
        int result;

        if (!parse_command_segment(segments[index], &parsed)) {
            if (previous_output != NULL) {
                CloseHandle(previous_output);
            }
            return 1;
        }

        if (parsed.input_path[0] != '\0') {
            input_handle = open_input_file_handle(parsed.input_path);
            if (input_handle == INVALID_HANDLE_VALUE) {
                print_windows_error("open", parsed.input_path);
                if (previous_output != NULL) {
                    CloseHandle(previous_output);
                }
                return 1;
            }
        } else if (previous_output != NULL) {
            input_handle = previous_output;
            SetFilePointer(input_handle, 0, NULL, FILE_BEGIN);
        }

        if (parsed.output_path[0] != '\0') {
            output_handle = open_output_file_handle(parsed.output_path, parsed.append_output);
            if (output_handle == INVALID_HANDLE_VALUE) {
                print_windows_error("open", parsed.output_path);
                if (input_handle != NULL && input_handle != previous_output) {
                    CloseHandle(input_handle);
                }
                if (previous_output != NULL) {
                    CloseHandle(previous_output);
                }
                return 1;
            }
        } else if (index < segment_count - 1) {
            temp_output = open_temp_pipe_file();
            if (temp_output == INVALID_HANDLE_VALUE) {
                if (input_handle != NULL && input_handle != previous_output) {
                    CloseHandle(input_handle);
                }
                if (previous_output != NULL) {
                    CloseHandle(previous_output);
                }
                fprintf(stderr, "pipeline: unable to create temporary buffer\n");
                return 1;
            }
            output_handle = temp_output;
        }

        result = execute_single_command(parsed.command, input_handle, output_handle);

        if (input_handle != NULL && input_handle != previous_output) {
            CloseHandle(input_handle);
        }
        if (previous_output != NULL) {
            CloseHandle(previous_output);
            previous_output = NULL;
        }

        if (parsed.output_path[0] != '\0') {
            if (output_handle != NULL) {
                CloseHandle(output_handle);
            }
        } else if (index < segment_count - 1) {
            FlushFileBuffers(output_handle);
            SetFilePointer(output_handle, 0, NULL, FILE_BEGIN);
            previous_output = output_handle;
        }

        if (result != 0) {
            if (previous_output != NULL) {
                CloseHandle(previous_output);
            }
            return result;
        }
    }

    if (previous_output != NULL) {
        CloseHandle(previous_output);
    }

    return 0;
}

static bool handle_command(char *line) {
    char *command;
    char full_line[MAX_LINE];
    char expanded_line[MAX_LINE];
    const char *history_line;

    command = trim_whitespace(line);
    if (*command == '\0') {
        return true;
    }

    history_line = lookup_history_expansion(command);
    if (history_line == NULL) {
        return true;
    }

    if (history_line != command) {
        printf("%s\n", history_line);
    }

    if (!expand_environment_variables(history_line, expanded_line, sizeof(expanded_line))) {
        fprintf(stderr, "environment expansion overflow\n");
        return true;
    }

    strncpy(full_line, expanded_line, sizeof(full_line) - 1);
    full_line[sizeof(full_line) - 1] = '\0';
    add_history_entry(full_line);

    command = trim_whitespace(full_line);

    if (_stricmp(command, "exit") == 0 || _stricmp(command, "quit") == 0) {
        return false;
    }

    if (_stricmp(command, "help") == 0) {
        print_help();
        emit_current_directory_control_line();
        return true;
    }

    execute_pipeline(full_line);
    emit_current_directory_control_line();
    return true;
}

int main(void) {
    char line[MAX_LINE];

    emit_current_directory_control_line();

    while (true) {
        if (!read_input_line(line, sizeof(line))) {
            putchar('\n');
            break;
        }

        if (!handle_command(line)) {
            break;
        }
    }

    return 0;
}




